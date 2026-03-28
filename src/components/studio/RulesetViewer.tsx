import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Info, Calculator, Building2, FileText } from "lucide-react";

const thClass = "text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium";

interface RulesetViewerProps {
  packVersionId: string;
}

export function RulesetViewer({ packVersionId }: RulesetViewerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["ruleset-viewer", packVersionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("jurisdiction_pack_versions")
        .select("ruleset, version_label")
        .eq("id", packVersionId)
        .maybeSingle();
      return data;
    },
    enabled: !!packVersionId,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const ruleset = data?.ruleset as any;
  if (!ruleset) {
    return (
      <div className="border border-border rounded-md bg-card px-4 py-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <p className="text-[12px] text-muted-foreground">Kein Regelwerk (ruleset) für diese Version hinterlegt.</p>
      </div>
    );
  }

  const engine = ruleset.calculation_engine;
  const benchmarks: any[] = engine?.residential_benchmarks ?? [];
  const authority = ruleset.jurisdiction?.authority;
  const submission = ruleset.submission;

  return (
    <div className="space-y-4">
      <h3 className="text-[13px] font-medium text-foreground flex items-center gap-2">
        <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
        Regelwerk – {data?.version_label ?? "–"}
      </h3>

      {/* Berechnungstyp */}
      {engine && (
        <div className="border border-border rounded-md bg-card px-4 py-3 space-y-1.5">
          <p className="text-[12px] font-medium text-foreground">Berechnungstyp</p>
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div>
              <span className="text-muted-foreground">Engine:</span>{" "}
              <span className="font-mono">{engine.type ?? "–"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Standard-Schwelle:</span>{" "}
              <span className="font-medium">{engine.standard_threshold ?? "–"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Absolutes Minimum:</span>{" "}
              <span className="font-medium">{engine.absolute_minimum ?? "–"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Wohnmodelle */}
      {benchmarks.length > 0 && (
        <div className="border border-border rounded-md bg-card px-4 py-3 space-y-2">
          <p className="text-[12px] font-medium text-foreground">Wohnmodelle ({benchmarks.length})</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={thClass}>Code</TableHead>
                <TableHead className={thClass}>Bezeichnung</TableHead>
                <TableHead className={`${thClass} text-right`}>Richtwert</TableHead>
                <TableHead className={thClass}>In MF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarks.map((b: any) => (
                <TableRow key={b.code}>
                  <TableCell className="text-[12px] font-mono">{b.code}</TableCell>
                  <TableCell className="text-[12px]">{b.label}</TableCell>
                  <TableCell className="text-[12px] text-right tabular-nums">{b.rate?.toFixed(1) ?? "–"} StP/WE</TableCell>
                  <TableCell>
                    {b.included_in_mf !== false ? (
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">Ja</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] border-0">Nein</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Behörde */}
      {authority && (
        <div className="border border-border rounded-md bg-card px-4 py-3 space-y-1.5">
          <p className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Behörde
          </p>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div><span className="text-muted-foreground">Name:</span> {authority.name ?? "–"}</div>
            <div><span className="text-muted-foreground">E-Mail:</span> {authority.email ?? "–"}</div>
          </div>
          {authority.pre_consultation_required_below_mf != null && (
            <p className="text-[11px] text-muted-foreground">
              Vorabstimmung erforderlich bei MF &lt; {authority.pre_consultation_required_below_mf}
            </p>
          )}
        </div>
      )}

      {/* Einreichung */}
      {submission && (
        <div className="border border-border rounded-md bg-card px-4 py-3 space-y-1.5">
          <p className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Einreichung
          </p>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            {submission.copies_required != null && (
              <div><span className="text-muted-foreground">Kopien:</span> {submission.copies_required}</div>
            )}
            {submission.digital_submission != null && (
              <div><span className="text-muted-foreground">Digital:</span> {submission.digital_submission ? "Ja" : "Nein"}</div>
            )}
          </div>
          {submission.required_attachments && (
            <div className="mt-1">
              <span className="text-[11px] text-muted-foreground">Pflichtanlagen:</span>
              <ul className="mt-0.5 space-y-0.5">
                {(submission.required_attachments as string[]).map((a: string, i: number) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
