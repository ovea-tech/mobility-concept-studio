import React, { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Info, ClipboardCheck, AlertTriangle } from "lucide-react";

interface ComplianceTabProps {
  projectId: string;
  project: any;
}

interface CheckItem {
  id: string;
  label: string;
  section: string;
  extended?: boolean;
}

export function ComplianceTab({ projectId, project }: ComplianceTabProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  /* ── Ruleset aus project-Join lesen (kein separater Query nötig) ── */
  const packVersionData = project?.jurisdiction_pack_versions as any;
  const isLoading = false;

  const ruleset = packVersionData?.ruleset as any;
  const mf = project?.mobility_factor != null ? Number(project.mobility_factor) : null;
  const standardThreshold = ruleset?.calculation_engine?.standard_threshold ?? 0.8;
  const needsExtended = mf != null && mf < standardThreshold;

  /* Build checklist items from ruleset */
  const checkItems = useMemo(() => {
    const items: CheckItem[] = [];
    const rs = ruleset?.requirements_standard;
    if (!rs) return items;

    const addSection = (section: string, obj: any, extended = false) => {
      if (!obj) return;
      if (typeof obj === "object" && !Array.isArray(obj)) {
        Object.entries(obj).forEach(([key, val]) => {
          if (typeof val === "string" && val.length > 0) {
            items.push({ id: `${section}-${key}`, label: val, section, extended });
          } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            const nested = val as any;
            if (typeof nested.label === "string" && nested.label.length > 0) {
              items.push({ id: `${section}-${key}`, label: nested.label, section, extended });
            } else if (typeof nested.description === "string" && nested.description.length > 0) {
              items.push({ id: `${section}-${key}`, label: nested.description, section, extended });
            }
          }
        });
      }
    };

    // Standard requirements sections
    if (rs.public_transit) addSection("ÖPNV", rs.public_transit);
    if (rs.local_amenities) addSection("Nahversorgung", rs.local_amenities);
    if (rs.parking_security) addSection("Stellplatz-Sicherung", rs.parking_security);
    if (rs.bicycle) addSection("Fahrrad", rs.bicycle);
    if (rs.sharing) addSection("Sharing", rs.sharing);

    // If items are empty, provide generic defaults
    if (items.length === 0) {
      items.push(
        { id: "oepnv-1", label: "ÖPNV-Anbindung dokumentiert", section: "ÖPNV" },
        { id: "nahv-1", label: "Nahversorgung im Umkreis nachgewiesen", section: "Nahversorgung" },
        { id: "park-1", label: "Stellplatz-Sicherungsmaßnahmen definiert", section: "Stellplatz-Sicherung" },
        { id: "rad-1", label: "Fahrradstellplätze geplant", section: "Fahrrad" },
        { id: "share-1", label: "Sharing-Angebot beschrieben", section: "Sharing" },
      );
    }

    // Extended requirements
    if (needsExtended) {
      const re = ruleset?.requirements_extended;
      if (re) {
        addSection("Erweiterte Anforderungen", re, true);
      }
      if (!items.some((i) => i.extended)) {
        items.push(
          { id: "ext-1", label: "Vorabstimmung mit Behörde durchgeführt", section: "Erweiterte Anforderungen", extended: true },
          { id: "ext-2", label: "Zusätzliche Mobilitätsmaßnahmen dokumentiert", section: "Erweiterte Anforderungen", extended: true },
        );
      }
    }

    return items;
  }, [ruleset, needsExtended]);

  const standardItems = checkItems.filter((i) => !i.extended);
  const extendedItems = checkItems.filter((i) => i.extended);
  const totalRequired = standardItems.length + (needsExtended ? extendedItems.length : 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPct = totalRequired > 0 ? Math.round((checkedCount / totalRequired) * 100) : 0;

  if (isLoading) return <div className="space-y-3 pt-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>;

  if (!ruleset) {
    return (
      <div className="max-w-4xl">
        <div className="border border-border rounded-md bg-card px-4 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-[12px] text-muted-foreground">Kein Regelwerk vorhanden. Die Nachweisführung wird aus dem Pack-Regelwerk generiert.</p>
        </div>
      </div>
    );
  }

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const sections = Array.from(new Set(checkItems.map((i) => i.section)));

  return (
    <div className="max-w-4xl space-y-6">
      {/* Status Bar */}
      <div className="border border-border rounded-md bg-card px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-medium">Nachweisführung</span>
          </div>
          <Badge variant="secondary" className="text-[11px]">
            {checkedCount} von {totalRequired} Pflichtpunkte erfüllt
          </Badge>
        </div>
        <Progress value={progressPct} className="h-2" />
        <p className="text-[11px] text-muted-foreground">
          Basierend auf {packVersionData?.version_label ?? "–"}
          {mf != null && ` · MF = ${mf.toFixed(2)}`}
        </p>
      </div>

      {/* Checklist Sections */}
      {sections.map((section) => {
        const sectionItems = checkItems.filter((i) => i.section === section);
        const isExtSection = sectionItems.every((i) => i.extended);
        return (
          <div key={section} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-medium text-foreground">{section}</h3>
              {isExtSection && (
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
                  Zusatzanforderung
                </Badge>
              )}
            </div>
            <div className="border border-border rounded-md bg-card divide-y divide-border">
              {sectionItems.map((item) => (
                <label key={item.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={checked[item.id] ?? false}
                    onCheckedChange={() => toggle(item.id)}
                  />
                  <span className={`text-[12px] ${checked[item.id] ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {/* Extended warning */}
      {needsExtended && (
        <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400">
            Bei MF &lt; {standardThreshold} gelten erweiterte Anforderungen. Alle Zusatzpunkte müssen vor der Einreichung erfüllt sein.
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Diese Checkliste dient der Selbstprüfung. Der aktuelle Stand wird mit der Einreichung im Snapshot gespeichert.
      </p>
    </div>
  );
}
