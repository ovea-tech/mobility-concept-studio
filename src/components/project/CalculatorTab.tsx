import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Lock, Info, AlertTriangle, CheckCircle, Calculator, Mail, Save, RotateCcw } from "lucide-react";

const thClass = "text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium";
const tdClass = "text-[13px]";

const NON_RESIDENTIAL_RATES: Record<string, {label: string; ratePerQm: number; unitLabel: string}> = {
  "Büro":          { label: "Büro / Verwaltung",      ratePerQm: 40,  unitLabel: "m² BGF je StP" },
  "Einzelhandel":  { label: "Einzelhandel",            ratePerQm: 30,  unitLabel: "m² VKF je StP" },
  "Gewerbe":       { label: "Gewerbe / Industrie",     ratePerQm: 60,  unitLabel: "m² BGF je StP" },
  "Gastronomie":   { label: "Gastronomie",             ratePerQm: 25,  unitLabel: "m² BGF je StP" },
  "Hotel":         { label: "Hotel / Beherbergung",    ratePerQm: 50,  unitLabel: "m² BGF je StP" },
  "Kita":          { label: "Kita / Schule",           ratePerQm: 75,  unitLabel: "m² BGF je StP" },
  "Arztpraxis":    { label: "Arztpraxis / Gesundheit", ratePerQm: 30,  unitLabel: "m² BGF je StP" },
};

interface CalculatorTabProps {
  projectId: string;
  project: any;
  onNavigate?: (tab: string) => void;
}

export function CalculatorTab({ projectId, project, onNavigate }: CalculatorTabProps) {
  const queryClient = useQueryClient();
  const isLocked = project?.mf_calculation_locked === true;

  /* ── Ruleset aus project-Join lesen (kein separater Query nötig) ── */
  const packVersionData = project?.jurisdiction_pack_versions as any;
  const ruleset = packVersionData?.ruleset as any;
  const engineType = ruleset?.calculation_engine?.type;
  const rawBenchmarks = ruleset?.calculation_engine?.residential_benchmarks ?? [];
  const benchmarks: Array<{code: string; label: string; rate: number; included_in_mf: boolean}> =
    (Array.isArray(rawBenchmarks) ? rawBenchmarks : []).map((b: any) => ({
      code:           String(b?.code  ?? ''),
      label:          String(b?.label ?? ''),
      rate:           parseFloat(String(b?.rate ?? 0)),
      included_in_mf: b?.included_in_mf !== false && b?.included_in_mf !== 'false',
    })).filter(b => b.code !== '');
  const rulesetLoading = !project?.jurisdiction_pack_versions ||
    !ruleset ||
    (engineType === "mobility_factor" && benchmarks.length === 0);

  /* ── Nutzungsarten ── */
  const { data: useTypes } = useQuery({
    queryKey: ["use_types", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("use_types").select("*").eq("project_id", projectId).order("created_at");
      return data ?? [];
    },
  });

  /* ── Baseline Requirements ── */
  const { data: baselineReqs } = useQuery({
    queryKey: ["baseline_requirements", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("baseline_requirements").select("*").eq("project_id", projectId);
      return data ?? [];
    },
  });

  /* ── Lokaler State ── */
  const [errichteteStellplaetze, setErrichteteStellplaetze] = useState<number>(project?.erected_parking_spaces ?? 0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (project?.erected_parking_spaces != null) {
      setErrichteteStellplaetze(project.erected_parking_spaces);
    }
  }, [project?.erected_parking_spaces]);

  /* ── Berechnung ── */
  const calculation = useMemo(() => {
    if (engineType !== "mobility_factor") return null;

    const rows = (useTypes ?? []).map((ut) => {
      const meta = (ut.metadata ?? {}) as any;
      const cat = ut.category as string | undefined;
      const nonRes = cat ? NON_RESIDENTIAL_RATES[cat] : undefined;

      if (nonRes && cat !== "Wohnen") {
        // Non-residential: rate based on BGF
        const bgf = ut.gross_floor_area_sqm ?? 0;
        const requiredSpaces = bgf > 0 ? Math.ceil(bgf / nonRes.ratePerQm) : null;
        return {
          id: ut.id, name: ut.name ?? '–', unit_count: ut.unit_count,
          category: cat, gross_floor_area_sqm: bgf,
          housing_type_code: undefined, housing_type_label: nonRes.label,
          rate: nonRes.ratePerQm, rateLabel: nonRes.unitLabel,
          requiredSpaces, includedInMf: true, isResidential: false,
        };
      }

      // Residential (Wohnen) logic
      const htCode = meta.housing_type_code as string | undefined;
      const benchmark = benchmarks.find((b: any) => b.code === htCode);
      const rate = benchmark?.rate != null ? parseFloat(String(benchmark.rate)) : null;
      const unitCount = ut.unit_count ?? 0;
      const requiredSpaces = rate != null ? Math.ceil(unitCount * rate) : null;
      const includedInMf = benchmark?.included_in_mf ?? true;
      return {
        id: ut.id, name: ut.name ?? '–', unit_count: ut.unit_count,
        category: cat ?? "Wohnen", gross_floor_area_sqm: ut.gross_floor_area_sqm,
        housing_type_code: htCode, housing_type_label: String(benchmark?.label ?? htCode ?? '–'),
        rate, rateLabel: "StP/WE",
        requiredSpaces, includedInMf, isResidential: true,
      };
    });

    const sumN = rows
      .filter((r) => r.includedInMf && r.requiredSpaces != null)
      .reduce((s, r) => s + (r.requiredSpaces ?? 0), 0);

    const E = errichteteStellplaetze;
    const mf = sumN > 0 ? Math.round((E / sumN) * 100) / 100 : null;

    const standardThreshold = parseFloat(String(ruleset?.calculation_engine?.standard_threshold ?? 0.8));
    const extendedMin = parseFloat(String(ruleset?.calculation_engine?.extended_threshold_min ?? 0.3));
    const absMin = parseFloat(String(ruleset?.calculation_engine?.absolute_minimum ?? 0.1));

    const stufe =
      mf === null ? null
        : mf >= standardThreshold ? "standard"
        : mf >= extendedMin ? "extended"
        : mf >= absMin ? "critical"
        : "below_minimum";

    const flaechengewinn = (sumN - E) * 12.5;
    const sharingMinArea = parseFloat(String(ruleset?.requirements_standard?.sharing?.min_area_qm ?? 12));
    const sharingPer10 = parseFloat(String(ruleset?.requirements_standard?.sharing?.area_qm_per_10_units ?? 6));
    const sharingPflicht = Math.max(sharingMinArea, Math.ceil((useTypes?.length ?? 0) / 10) * sharingPer10);
    const sharingExtended = flaechengewinn * 0.2;
    const carsharingPflicht = flaechengewinn * 0.1;
    const lastenradPflicht = flaechengewinn * 0.05;
    const optionaleBausteine =
      stufe === "extended" ? Math.max(0, Math.floor((standardThreshold - mf!) / 0.1)) : 0;

    return {
      rows, sumN, E, mf, stufe, standardThreshold, extendedMin, absMin,
      flaechengewinn, sharingPflicht, sharingExtended,
      carsharingPflicht, lastenradPflicht, optionaleBausteine,
      thresholdMinUnits: ruleset?.calculation_engine?.threshold_min_units ?? 10,
    };
  }, [useTypes, errichteteStellplaetze, ruleset, engineType, benchmarks]);

  /* ── Save ── */
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isLocked) throw new Error("Berechnung ist nach Einreichung gesperrt.");
      if (!calculation) throw new Error("Keine Berechnung vorhanden.");

      // Delete+insert baseline_requirements (no unique constraint)
      const brInserts = calculation.rows
        .filter((r) => r.requiredSpaces != null)
        .map((r) => ({
          project_id: projectId,
          use_type_id: r.id,
          required_spaces: r.requiredSpaces!,
          calculation_basis: `${r.unit_count ?? 0} WE × ${r.rate} StP/WE`,
          rule_reference: `${packVersionData?.version_label ?? ""} / ${r.housing_type_code ?? ""}`,
          metadata: {
            housing_type_code: r.housing_type_code,
            housing_type_label: r.housing_type_label,
            rate_used: r.rate,
            engine_type: engineType,
          },
        }));

      // Delete existing for this project (only if rows exist)
      const { data: existing } = await supabase
        .from("baseline_requirements")
        .select("id")
        .eq("project_id", projectId);
      if (existing && existing.length > 0) {
        await supabase.from("baseline_requirements").delete().eq("project_id", projectId);
      }

      if (brInserts.length > 0) {
        const { error } = await supabase.from("baseline_requirements").insert(brInserts as any);
        if (error) throw error;
      }

      const { data: userData } = await supabase.auth.getUser();
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          erected_parking_spaces: calculation.E,
          mobility_factor: calculation.mf,
          mf_calculated_at: new Date().toISOString(),
          mf_calculated_by: userData.user?.id ?? null,
        })
        .eq("id", projectId);

      if (projectError) throw projectError;
      setHasUnsavedChanges(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["baseline_requirements", projectId] });
      toast.success(`Berechnung gespeichert – MF = ${calculation?.mf?.toFixed(2) ?? "–"}`);
    },
    onError: (error: any) => toast.error("Fehler: " + (error.message || "Unbekannt")),
  });

  /* ── Set Housing Type ── */
  const setHousingTypeMutation = useMutation({
    mutationFn: async ({ useTypeId, code }: { useTypeId: string; code: string }) => {
      const benchmark = benchmarks.find((b: any) => b.code === code);
      const existing = useTypes?.find((u) => u.id === useTypeId);
      const { error } = await supabase
        .from("use_types")
        .update({
          metadata: {
            ...((existing?.metadata as any) ?? {}),
            housing_type_code: code,
            parking_rate: benchmark?.rate ?? null,
          },
        })
        .eq("id", useTypeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["use_types", projectId] });
      setHasUnsavedChanges(true);
    },
  });

  /* ── Render ── */
  if (rulesetLoading) return <div className="space-y-3 pt-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>;

  if (isLocked) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">Berechnung gesperrt</p>
            <p className="text-[12px] text-amber-700 dark:text-amber-400 mt-0.5">
              Diese Berechnung wurde mit der Einreichung
              {project.mf_calculated_at ? ` vom ${new Date(project.mf_calculated_at).toLocaleDateString("de-DE")}` : ""} eingefroren.
              Änderungen sind nicht mehr möglich.
            </p>
          </div>
        </div>
        {project.mobility_factor != null && (
          <div className="border border-border rounded-md bg-card px-4 py-3">
            <p className="text-[13px] text-muted-foreground">Gespeicherter Mobilitätsfaktor</p>
            <p className="text-2xl font-bold text-foreground mt-1">MF = {Number(project.mobility_factor).toFixed(2)}</p>
          </div>
        )}
      </div>
    );
  }

  if (!ruleset) {
    return (
      <div className="max-w-4xl">
        <div className="border border-border rounded-md bg-card px-4 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-[13px] font-medium">Kein Regelwerk vorhanden</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Für die zugewiesene Pack-Version ist kein Regelwerk (ruleset) hinterlegt.</p>
          </div>
        </div>
      </div>
    );
  }

  if (engineType !== "mobility_factor") {
    return (
      <div className="max-w-4xl">
        <div className="border border-border rounded-md bg-card px-4 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-[13px] font-medium">Berechnungstyp: {engineType || "unbekannt"}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Manuelle Berechnung erforderlich. Automatische Kalkulation ist nur für den Typ „mobility_factor" verfügbar.</p>
          </div>
        </div>
      </div>
    );
  }

  const stufeConfig: Record<string, { color: string; label: string; textColor: string }> = {
    standard: { color: "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800", label: "Standardkonzept", textColor: "text-green-800 dark:text-green-300" },
    extended: { color: "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800", label: "Erweitertes Konzept", textColor: "text-amber-800 dark:text-amber-300" },
    critical: { color: "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800", label: "Grenzbereich", textColor: "text-red-800 dark:text-red-300" },
    below_minimum: { color: "border-red-500 bg-red-100 dark:bg-red-950/30 dark:border-red-700", label: "Unter Mindestwert", textColor: "text-red-900 dark:text-red-200" },
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground">
            {ruleset?.terminology?.document_name ?? "MF-Kalkulator"} – Berechnung nach {packVersionData?.version_label ?? "–"}
          </span>
        </div>

        {/* ABSCHNITT 1: Wohnmodelle */}
        <section className="space-y-3">
          <h3 className="text-[13px] font-medium text-foreground">Wohnmodelle & Stellplatzbedarf</h3>

          {!useTypes?.length ? (
            <div className="border border-border rounded-md bg-card px-4 py-3">
              <p className="text-[12px] text-muted-foreground">
                Keine Nutzungsarten erfasst. Legen Sie zunächst Nutzungsarten im Tab „Nutzungen & Bilanz" an.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={thClass}>Nutzungsart</TableHead>
                  <TableHead className={thClass}>Wohnmodell</TableHead>
                  <TableHead className={`${thClass} text-right`}>WE</TableHead>
                  <TableHead className={`${thClass} text-right`}>Richtwert</TableHead>
                  <TableHead className={`${thClass} text-right`}>N (Stellplätze)</TableHead>
                  <TableHead className={thClass}>In MF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculation?.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className={`${tdClass} font-medium`}>{row.name}</TableCell>
                    <TableCell>
                      <select
                        value={row.housing_type_code ?? ""}
                        onChange={(e) => {
                          if (!isLocked && e.target.value) {
                            setHousingTypeMutation.mutate({ useTypeId: row.id, code: e.target.value });
                          }
                        }}
                        disabled={isLocked}
                        className="h-7 w-44 text-[12px] border border-input rounded-md bg-background px-2 text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Auswählen…</option>
                        {benchmarks.map((b) => (
                          <option key={String(b.code)} value={String(b.code)}>
                            {String(b.label)}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className={`${tdClass} text-right tabular-nums`}>{row.unit_count ?? 0}</TableCell>
                    <TableCell className={`${tdClass} text-right tabular-nums`}>
                      {row.rate != null ? `${Number(row.rate).toFixed(1)} StP/WE` : "–"}
                    </TableCell>
                    <TableCell className={`${tdClass} text-right tabular-nums font-medium bg-muted/30`}>
                      {row.requiredSpaces ?? "–"}
                    </TableCell>
                    <TableCell>
                      {row.housing_type_code ? (
                        row.includedInMf ? (
                          <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">Ja</Badge>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-[10px] border-0">Nein</Badge>
                            </TooltipTrigger>
                            <TooltipContent className="text-[11px]">
                              {row.housing_type_label} fließt nicht in MF-Berechnung ein
                            </TooltipContent>
                          </Tooltip>
                        )
                      ) : (
                        <span className="text-[11px] text-muted-foreground">–</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {calculation && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <span className="text-[13px] font-medium">Summe N (für MF-Berechnung): {calculation.sumN} Stellplätze</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Mindestens {calculation.thresholdMinUnits} WE erforderlich für Mobilitätskonzept
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ABSCHNITT 2: Errichtete Stellplätze */}
        <section className="space-y-2">
          <h3 className="text-[13px] font-medium text-foreground">Errichtete Stellplätze (E)</h3>
          <div className="max-w-xs space-y-1.5">
            <Label className="text-[12px]">Geplante Stellplätze (E)</Label>
            <Input
              type="number"
              min={0}
              value={errichteteStellplaetze}
              onChange={(e) => { setErrichteteStellplaetze(Number(e.target.value) || 0); setHasUnsavedChanges(true); }}
              disabled={isLocked}
              className="h-9 text-[13px] w-32"
            />
            <p className="text-[11px] text-muted-foreground">Mindestens 1 Stellplatz erforderlich. Carsharing-Stellplätze können eingerechnet werden.</p>
          </div>
        </section>

        {/* ABSCHNITT 3: Ergebnis */}
        {calculation?.mf != null && calculation.stufe && (
          <section className="space-y-3">
            <h3 className="text-[13px] font-medium text-foreground">Ergebnis: Mobilitätsfaktor</h3>

            <div className="border border-border rounded-md bg-card px-5 py-4">
              <p className="text-3xl font-bold text-foreground tabular-nums">MF = {calculation.mf.toFixed(2)}</p>
              <p className="text-[12px] text-muted-foreground mt-1 font-mono">
                E ÷ N = {calculation.E} ÷ {calculation.sumN} = {calculation.mf.toFixed(2)}
              </p>
            </div>

            {/* Stufe Card */}
            {(() => {
              const cfg = stufeConfig[calculation.stufe!];
              const authority = ruleset?.jurisdiction?.authority;
              return (
                <div className={`border rounded-md px-4 py-3 ${cfg.color}`}>
                  <p className={`text-[13px] font-medium ${cfg.textColor}`}>{cfg.label}</p>
                  {calculation.stufe === "standard" && (
                    <p className="text-[12px] mt-1 opacity-80">Mindestanforderungen (Abschnitt 2) ausreichend. Vorabstimmung nicht erforderlich.</p>
                  )}
                  {calculation.stufe === "extended" && (
                    <div>
                      <p className="text-[12px] mt-1 opacity-80">
                        Zusätzliche Anforderungen (Abschnitt 3) erforderlich.
                        {authority?.name ? ` Vorabstimmung mit ${authority.name} nötig.` : " Vorabstimmung nötig."}
                      </p>
                      {authority?.email && (
                        <a href={`mailto:${authority.email}`} className="inline-flex items-center gap-1 text-[11px] mt-1 underline">
                          <Mail className="h-3 w-3" /> {authority.email}
                        </a>
                      )}
                    </div>
                  )}
                  {calculation.stufe === "critical" && (
                    <p className="text-[12px] mt-1 opacity-80">
                      Nähert sich dem absoluten Minimum von {calculation.absMin}. Intensive Abstimmung erforderlich.
                    </p>
                  )}
                  {calculation.stufe === "below_minimum" && (
                    <p className="text-[12px] mt-1 opacity-80">
                      MF unterschreitet das absolute Minimum von {calculation.absMin}. Nicht genehmigungsfähig.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Pflicht-Flächen bei MF < 0.8 */}
            {(calculation.stufe === "extended" || calculation.stufe === "critical") && (
              <>
                <div className="border border-border rounded-md bg-card px-4 py-3 space-y-2">
                  <p className="text-[12px] font-medium text-foreground">Pflicht-Flächen bei MF &lt; 0,8</p>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-[12px] font-medium py-1.5">Sharing-Fläche</TableCell>
                        <TableCell className="text-[12px] text-right tabular-nums py-1.5">
                          {Math.max(calculation.sharingPflicht, calculation.sharingExtended).toFixed(1)} m²
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground py-1.5">
                          (N−E) × 12,5 m² × 20% = {calculation.sharingExtended.toFixed(1)} m²
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-[12px] font-medium py-1.5">Car-Sharing</TableCell>
                        <TableCell className="text-[12px] text-right tabular-nums py-1.5">
                          {calculation.carsharingPflicht.toFixed(1)} m²
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground py-1.5">
                          mind. 1 Stellplatz + 1 Fahrzeug
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-[12px] font-medium py-1.5">Lastenrad</TableCell>
                        <TableCell className="text-[12px] text-right tabular-nums py-1.5">
                          {calculation.lastenradPflicht.toFixed(1)} m²
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground py-1.5">
                          mind. 5%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="border border-border rounded-md bg-card px-4 py-3">
                  <p className="text-[12px] font-medium text-foreground mb-1">Optionale Bausteine</p>
                  <p className="text-[12px] text-muted-foreground">
                    Benötigte Bausteine: <span className="font-medium text-foreground">{calculation.optionaleBausteine}</span> (je 0,1 MF-Absenkung ab 0,8)
                  </p>
                  {ruleset?.requirements_extended?.optional_measures_per_01_step && (
                    <ul className="mt-2 space-y-0.5">
                      {(ruleset.requirements_extended.optional_measures_per_01_step as Array<{id: string; label: string} | string>).map((m, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" /> {typeof m === 'string' ? m : m.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* BLOCK 6: Wirtschaftliche Einschätzung */}
        {calculation?.mf != null && calculation.sumN > calculation.E && (() => {
          const eingesparte = Math.max(0, calculation.sumN - calculation.E);
          const baukosten = eingesparte * 25000;
          const flaeche = eingesparte * 12.5;
          const mietpotenzial = Math.round(flaeche * 18 * 12);
          return (
            <section className="space-y-3">
              <h3 className="text-[13px] font-medium text-foreground">Wirtschaftliche Einschätzung</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border rounded-md bg-muted/20 p-3">
                  <p className="text-[11px] text-muted-foreground">Einsparung Baukosten</p>
                  <p className="text-[16px] font-bold text-foreground tabular-nums mt-1">{baukosten.toLocaleString("de-DE")} €</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{eingesparte} StP × 25.000 €</p>
                </div>
                <div className="border border-border rounded-md bg-muted/20 p-3">
                  <p className="text-[11px] text-muted-foreground">Gewonnene Fläche</p>
                  <p className="text-[16px] font-bold text-foreground tabular-nums mt-1">{flaeche.toLocaleString("de-DE")} m²</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Umnutzung als Wohn-/Bürofläche</p>
                </div>
                <div className="border border-border rounded-md bg-muted/20 p-3">
                  <p className="text-[11px] text-muted-foreground">Mietpotenzial p.a.</p>
                  <p className="text-[16px] font-bold text-foreground tabular-nums mt-1">{mietpotenzial.toLocaleString("de-DE")} €</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Bei 18 €/m² Münchner Mietspiegel</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">* Planungsrichtwerte. Individuelle Kalkulation empfohlen.</p>
            </section>
          );
        })()}

        {calculation?.mf != null && calculation.stufe && onNavigate && (
          calculation.stufe === "standard" ? (
            <div className="border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800 rounded-md px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-green-800 dark:text-green-300">Standardkonzept – Mindestanforderungen ausreichend</p>
                  <p className="text-[12px] text-green-700 dark:text-green-400 mt-0.5">Nächster Schritt: Checkliste unter Nachweis ausfüllen</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[12px] shrink-0" onClick={() => onNavigate("compliance")}>
                → Zur Nachweisführung
              </Button>
            </div>
          ) : (
            <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">Erweitertes Konzept erforderlich</p>
                  <p className="text-[12px] text-amber-700 dark:text-amber-400 mt-0.5">Vorabstimmung mit LBK München nötig. Nächster Schritt: Pflicht-Maßnahmen definieren</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[12px] shrink-0" onClick={() => onNavigate("scenarios")}>
                → Zu Szenarien & Maßnahmen
              </Button>
            </div>
          )
        )}

        {/* ABSCHNITT 4: Save Bar */}
        <div className="sticky bottom-0 bg-background border-t border-border -mx-6 px-6 py-3">
          {hasUnsavedChanges && !isLocked ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-[13px] font-medium text-amber-700 dark:text-amber-400">Ungespeicherte Änderungen</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[13px]"
                  onClick={() => { setErrichteteStellplaetze(project?.erected_parking_spaces ?? 0); setHasUnsavedChanges(false); }}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Verwerfen
                </Button>
                <Button size="sm" className="h-8 text-[13px]" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saveMutation.isPending ? "Speichert…" : "Berechnung speichern"}
                </Button>
              </div>
            </div>
          ) : !hasUnsavedChanges && project?.mobility_factor != null ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-[13px] text-green-700 dark:text-green-400">
                Gespeichert: MF {Number(project.mobility_factor).toFixed(2)}
                {project.mf_calculated_at && ` · ${new Date(project.mf_calculated_at).toLocaleDateString("de-DE")}`}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
