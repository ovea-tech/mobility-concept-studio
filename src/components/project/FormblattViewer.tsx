import React, { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, X, Info } from "lucide-react";
import { toast } from "sonner";

interface FormblattViewerProps {
  project: any;
  useTypes: any[];
  sites: any[];
  measures: any[];
  onClose: () => void;
}

export function FormblattViewer({ project, useTypes, sites, measures, onClose }: FormblattViewerProps) {
  const queryClient = useQueryClient();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if form template is supported for this jurisdiction
  const formTemplateId = (project?.jurisdiction_pack_versions as Record<string, unknown>)?.ruleset
    ? ((project?.jurisdiction_pack_versions as any)?.ruleset?.submission?.form_template_id as string | undefined)
    : undefined;
  const isSupported = formTemplateId === "munich_lbk_2023" || !formTemplateId; // default to supported if no explicit ID

  // ── Berechnungen aus Ruleset ──
  const ruleset = (project?.jurisdiction_pack_versions as any)?.ruleset as any;
  const benchmarks = ruleset?.calculation_engine?.residential_benchmarks ?? [];
  const benchMap = Object.fromEntries(benchmarks.map((b: any) => [b.code, b]));

  const rows = useTypes.map((ut) => {
    const code = ((ut.metadata as any)?.housing_type_code as string) ?? "";
    const b = benchMap[code] ?? {};
    const rate = parseFloat(b.rate ?? "1");
    const we = ut.unit_count ?? 0;
    const N = Math.ceil(we * rate);
    return { name: ut.name, code, label: (b.label as string) ?? code, we, rate, N, included: b.included_in_mf ?? true };
  });

  const sumN = rows.filter((r) => r.included).reduce((s, r) => s + r.N, 0);
  const weTotal = rows.reduce((s, r) => s + r.we, 0);
  const bgfTotal = useTypes.reduce((s, ut) => s + parseFloat(String(ut.gross_floor_area_sqm ?? "0")), 0);
  const E = project?.erected_parking_spaces ?? 0;
  const MF = sumN > 0 ? Math.round((E / sumN) * 100) / 100 : 0;
  const standardThreshold = parseFloat(ruleset?.calculation_engine?.standard_threshold ?? "0.8");
  const isStandard = MF >= standardThreshold;

  const sharingQmPer10 = parseFloat(ruleset?.requirements_standard?.sharing?.area_qm_per_10_units ?? "6");
  const sharingMin = parseFloat(ruleset?.requirements_standard?.sharing?.min_area_qm ?? "12");
  const sharingStandard = Math.max(sharingMin, Math.ceil(weTotal / 10) * sharingQmPer10);
  const flaechengewinn = Math.max(0, sumN - E) * 12.5;
  const sharing20 = Math.round(flaechengewinn * 0.2 * 10) / 10;
  const lastenrad5 = Math.round(flaechengewinn * 0.05 * 10) / 10;

  const fahrradRatio = parseFloat(ruleset?.requirements_standard?.fahrrad?.base_ratio_qm_per_bike ?? "30");
  const fahrradRequired = Math.ceil(bgfTotal / fahrradRatio);

  const site = sites[0] ?? {};
  const addrParts = ((site.address as string) ?? "").split(",");
  const strasseVoll = addrParts[0]?.trim() ?? "";
  const sm = strasseVoll.match(/^(.*?)\s+(\d+\w*)$/);
  const strasse = sm ? sm[1] : strasseVoll;
  const hausnr = sm ? sm[2] : "";
  const org = (project?.workspaces as any)?.organizations?.name ?? "";
  const today = new Date().toLocaleDateString("de-DE");

  async function generatePdf() {
    const { data, error: dlErr } = await supabase.storage.from("form-templates").download("munich/lbk_mk_2023.pdf");
    if (dlErr || !data) throw new Error("Formblatt konnte nicht geladen werden: " + dlErr?.message);

    const arrayBuffer = await data.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();

    const setText = (id: string, val: string, fontSize = 10) => {
      try {
        const f = form.getTextField(id);
        f.setText(val);
        f.setFontSize(fontSize);
      } catch {}
    };
    const setCheck = (id: string, v: boolean) => {
      try { const cb = form.getCheckBox(id); v ? cb.check() : cb.uncheck(); } catch {}
    };
    const setRadio = (id: string, val: string) => {
      try { form.getRadioGroup(id).select(val); } catch {}
    };

    // SEITE 1
    setText("Fertigung", "1");
    setRadio("Interessent", "/Firma");
    setText("firmenname", org);
    setText("flurStrasse", strasse);
    setText("flurHausnummerVonZahl", hausnr);
    setText("Gemarkung", (project?.jurisdiction_pack_versions as any)?.ruleset?.jurisdiction?.district ?? "");
    setText("Stadtbezirk", String((site?.metadata as any)?.stadtbezirk ?? (project?.workspaces as any)?.metadata?.default_stadtbezirk ?? ""));
    setText("vorhabenBezeichnung", project.name + " – Wohnungsbau mit " + weTotal + " Wohneinheiten, " + (site.address ?? ""));
    setText("aktenzeichen", "");

    // SEITE 2 – Wohnmodell-Tabelle
    rows.slice(0, 7).forEach((row, i) => {
      const n = i + 1;
      setText("Modellart " + n, row.label);
      setText("WE " + n, String(row.we));
      setText("Richtwert Wohnmodell " + n, String(row.rate).replace(".", ","));
      setText("Anzahl N " + n, String(row.N));
    });
    setText("Anzahl WE", String(weTotal));
    setText("Anzahl N Summe", String(sumN));
    setText("Anzahl E", String(E));
    setText("MF", String(MF).replace(".", ","));
    setCheck("ÖPNV erfüllt", true);
    setCheck("Laden erfüllt", true);
    setCheck("Stpl Gemein", true);
    setCheck("Stpl Sicherung erfüllt", true);
    setText("G", String(Math.round(bgfTotal)));
    setText("E Fahrrad", String(fahrradRequired));
    setText("Richtwert", String(fahrradRatio));
    setCheck("Richtwert Fahrrad erfüllt", true);
    setText("Fläche Sharing", String(Math.round(sharingStandard)));
    setCheck("Fläche Sharing2 erfüllt", true);

    // SEITE 3 – Zusatzanforderungen
    if (!isStandard) {
      setText("Stpl N", String(sumN));
      setText("Stpl E", String(E));
      setText("Stpl Differenz", String(sumN - E));
      setText("Flächengewinn", String(Math.round(flaechengewinn)));
      setText("20%", String(sharing20).replace(".", ","));
      setCheck("20% erfüllt", true);
      setText("Car Fremd", "2");
      setText("Car Elektro", "2");
      setCheck("Car Sharing erfüllt", true);
      setText("Lastenrad", String(Math.round(lastenrad5)));
      setCheck("Lastenrad erfüllt", true);
      setText("Art Lastentransport", "Lastenräder + Lastenanhänger, Gemeinschaftsnutzung");
      setText("Sicherung Alt", "Beschränkt persönliche Dienstbarkeit zugunsten der Landeshauptstadt München");
      setText("Gemein Rad", "10");
      setCheck("Gemeinrad erfüllt", true);
      setText("MVV", "2");
      setCheck("MVV erfüllt", true);
    }

    // SEITE 4 – Individuelle Beschreibung
    const massText =
      measures.length > 0
        ? measures.map((m: any) => m.name + (m.description ? "\n" + m.description : "")).join("\n\n")
        : "Individuelle Beschreibung der Mobilitätsmaßnahmen (bitte ausfüllen)";
    setText("Individuell", massText, 12);

    // SEITE 5 + 6
    setText("Datum Unterschrift", today);
    setText("Anlage1", "Lageplan M 1:1.000");
    setText("Anlage Anzahl 1", "1");
    setText("Anlage2", "Übersichtsplan ÖPNV-Erschließung + Nahversorgung");
    setText("Anlage Anzahl 2", "1");
    setText("Anlage3", "Darstellung PKW-Stellplätze, Fahrradabstellplätze und Sharing-Flächen");
    setText("Anlage Anzahl 3", "1");

    return await pdfDoc.save();
  }

  async function loadPdf() {
    setLoading(true);
    setError(null);
    try {
      const bytes = await generatePdf();
      const bytesCopy = new Uint8Array(bytes);
      setPdfBytes(bytesCopy);
      const blob = new Blob([bytesCopy.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPdf();
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload() {
    if (!pdfBytes) return;
    const filename = "MK_" + project.name.replace(/[^a-zA-Z0-9]/g, "_") + "_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    try {
      const { data: session } = await supabase.auth.getUser();
      await supabase.from("output_packages").insert({
        project_id: project.id,
        name: filename,
        package_type: "lbk_formblatt_muenchen",
        file_path: filename,
        file_name: filename,
        file_type: "application/pdf",
        generated_by: session.user?.id ?? null,
      });
    } catch {}

    queryClient.invalidateQueries({ queryKey: ["output_packages", project.id] });
    toast.success("PDF heruntergeladen");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Skeleton className="h-8 w-64" />
        <p className="text-[13px] text-muted-foreground">Formblatt wird vorbereitet…</p>
        <Skeleton className="h-[60vh] w-full max-w-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-[14px] font-medium text-foreground">Fehler beim Laden des Formblatts</p>
        <p className="text-[12px] text-muted-foreground max-w-md text-center">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Schließen</Button>
          <Button size="sm" onClick={loadPdf} className="text-[13px]">Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="h-[60px] border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <span className="text-[13px] font-medium text-foreground truncate">
          LBK München – Mobilitätskonzept Formblatt (Stand September 2023)
        </span>
        <Badge variant="outline" className="bg-accent text-accent-foreground border-border text-[11px] shrink-0 mx-4">
          Bitte alle Angaben prüfen und ggf. anpassen
        </Badge>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleDownload} className="h-8 text-[13px]">
            <Download className="h-3.5 w-3.5 mr-1.5" /> PDF herunterladen
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-[13px]">
            <X className="h-3.5 w-3.5 mr-1.5" /> Schließen
          </Button>
        </div>
      </div>

      {/* PDF iframe */}
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          className="flex-1 w-full border-none"
          title="LBK Formblatt"
        />
      )}
    </div>
  );
}
