import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MousePointer2, Square, Accessibility, Bike, Zap, Car,
  Package, Type, Minus, Trash2, Undo2, Redo2, Grid3X3, Download, Save,
  Ruler, AlertTriangle,
} from "lucide-react";

declare const jspdf: any;

/* ── Types ── */
interface DrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  endX?: number;
  endY?: number;
}

interface PlanDrawingTabProps {
  projectId: string;
  projectName?: string;
}

/* ── Constants ── */
const PX_PER_METER = 10;
const SNAP = 5; // 0.5m snap
const snap = (v: number) => Math.round(v / SNAP) * SNAP;

const TOOLS = [
  { id: "select", label: "Auswählen", sub: "", icon: MousePointer2, color: "#000", w: 0, h: 0, lbl: "" },
  { id: "parking_car", label: "PKW", sub: "2,3×5,0m", icon: Square, color: "#1f2937", w: 23, h: 50, lbl: "P" },
  { id: "parking_disabled", label: "Behindert", sub: "3,5×5,0m", icon: Accessibility, color: "#3b82f6", w: 35, h: 50, lbl: "♿" },
  { id: "parking_bike", label: "Fahrrad", sub: "2,0×0,6m", icon: Bike, color: "#eab308", w: 20, h: 6, lbl: "F" },
  { id: "ev_charger", label: "E-Ladesäule", sub: "1,0×1,0m", icon: Zap, color: "#22c55e", w: 10, h: 10, lbl: "⚡" },
  { id: "sharing_area", label: "Sharing", sub: "frei", icon: Package, color: "#22c55e", w: 60, h: 40, lbl: "SHARING" },
  { id: "carsharing", label: "Carsharing", sub: "2,3×5,0m", icon: Car, color: "#06b6d4", w: 23, h: 50, lbl: "CS" },
  { id: "cargo_bike", label: "Lastenrad", sub: "2,5×1,2m", icon: Package, color: "#f97316", w: 25, h: 12, lbl: "LR" },
  { id: "dimension", label: "Maßkette", sub: "", icon: Ruler, color: "#374151", w: 0, h: 0, lbl: "" },
  { id: "text", label: "Text", sub: "", icon: Type, color: "#374151", w: 60, h: 20, lbl: "Text" },
  { id: "fahrgasse", label: "Fahrgasse", sub: "6,5m", icon: Minus, color: "#9ca3af", w: 100, h: 65, lbl: "Fahrgasse 6,5m" },
];

const CANVAS_W = 1400;
const CANVAS_H = 900;

export function PlanDrawingTab({ projectId, projectName }: PlanDrawingTabProps) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(1);
  const [history, setHistory] = useState<DrawElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [dimStart, setDimStart] = useState<{ x: number; y: number } | null>(null);

  // Load jsPDF
  useEffect(() => {
    if (!(window as any).jspdf) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.head.appendChild(s);
    }
  }, []);

  const pushHistory = useCallback(
    (newElements: DrawElement[]) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newElements]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const undo = () => {
    if (historyIndex <= 0) return;
    const i = historyIndex - 1;
    setHistoryIndex(i);
    setElements(history[i]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const i = historyIndex + 1;
    setHistoryIndex(i);
    setElements(history[i]);
  };

  /* ── Drawing ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, w / scale, h / scale);

    // Grid
    if (showGrid) {
      const sw = w / scale;
      const sh = h / scale;
      for (let x = 0; x <= sw; x += 10) {
        const isMajor = x % 100 === 0;
        const isMid = x % 50 === 0;
        ctx.strokeStyle = isMajor ? "#d1d5db" : isMid ? "#e5e7eb" : "#eeeff1";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, sh);
        ctx.stroke();
      }
      for (let y = 0; y <= sh; y += 10) {
        const isMajor = y % 100 === 0;
        const isMid = y % 50 === 0;
        ctx.strokeStyle = isMajor ? "#d1d5db" : isMid ? "#e5e7eb" : "#eeeff1";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(sw, y);
        ctx.stroke();
      }
      // Grid labels
      ctx.fillStyle = "#9ca3af";
      ctx.font = "9px Arial";
      ctx.textAlign = "left";
      for (let x = 100; x < sw; x += 100) {
        ctx.fillText(`${x / PX_PER_METER}m`, x + 2, 12);
      }
      ctx.textAlign = "right";
      for (let y = 100; y < sh; y += 100) {
        ctx.fillText(`${y / PX_PER_METER}m`, sw - 4, y - 2);
      }
    }

    // Elements
    elements.forEach((el) => {
      const isSel = el.id === selectedId;
      ctx.setLineDash([]);

      if (el.type === "dimension") {
        // Dimension line with arrows
        const ex = el.endX ?? el.x + el.width;
        const ey = el.endY ?? el.y;
        ctx.strokeStyle = isSel ? "#2563eb" : "#374151";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrows
        const angle = Math.atan2(ey - el.y, ex - el.x);
        const aLen = 6;
        for (const [px, py, dir] of [[el.x, el.y, 1], [ex, ey, -1]] as [number, number, number][]) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dir * aLen * Math.cos(angle - 0.4), py + dir * aLen * Math.sin(angle - 0.4));
          ctx.moveTo(px, py);
          ctx.lineTo(px + dir * aLen * Math.cos(angle + 0.4), py + dir * aLen * Math.sin(angle + 0.4));
          ctx.stroke();
        }

        // Distance label
        const distPx = Math.sqrt((ex - el.x) ** 2 + (ey - el.y) ** 2);
        const distM = (distPx / PX_PER_METER).toFixed(2).replace(".", ",");
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const mx = (el.x + ex) / 2;
        const my = (el.y + ey) / 2;
        ctx.fillText(`${distM} m`, mx, my - 3);
        return;
      }

      if (el.type === "sharing_area") {
        ctx.setLineDash([6, 3]);
        ctx.fillStyle = "rgba(34,197,94,0.15)";
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "fahrgasse") {
        ctx.fillStyle = "rgba(156,163,175,0.08)";
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }

      // Stroke
      ctx.strokeStyle = isSel ? "#2563eb" : el.color;
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(el.x, el.y, el.width, el.height);
      ctx.setLineDash([]);

      // Hatch for disabled parking
      if (el.type === "parking_disabled") {
        ctx.strokeStyle = "#3b82f640";
        ctx.lineWidth = 0.5;
        for (let d = 0; d < el.width + el.height; d += 5) {
          ctx.beginPath();
          ctx.moveTo(el.x + Math.min(d, el.width), el.y + Math.max(0, d - el.width));
          ctx.lineTo(el.x + Math.max(0, d - el.height), el.y + Math.min(d, el.height));
          ctx.stroke();
        }
      }

      // Label
      if (el.label) {
        ctx.fillStyle = "#1f2937";
        const fontSize = Math.min(10, el.height * 0.6, el.width * 0.3);
        ctx.font = `${Math.max(6, fontSize)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label, el.x + el.width / 2, el.y + el.height / 2, el.width - 2);
      }
    });

    // Scale bar (bottom left)
    const sbY = h / scale - 20;
    ctx.strokeStyle = "#374151";
    ctx.fillStyle = "#374151";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, sbY);
    ctx.lineTo(120, sbY);
    ctx.stroke();
    // Ticks
    for (const tx of [20, 70, 120]) {
      ctx.beginPath();
      ctx.moveTo(tx, sbY - 4);
      ctx.lineTo(tx, sbY + 4);
      ctx.stroke();
    }
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("0", 20, sbY + 6);
    ctx.fillText("5m", 70, sbY + 6);
    ctx.fillText("10m", 120, sbY + 6);

    // North arrow (top right)
    const nX = w / scale - 30;
    ctx.fillStyle = "#374151";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("N", nX, 22);
    ctx.beginPath();
    ctx.moveTo(nX, 24);
    ctx.lineTo(nX - 5, 34);
    ctx.lineTo(nX + 5, 34);
    ctx.closePath();
    ctx.fill();

    // Title block (bottom right)
    const tbW = 320;
    const tbH = 100;
    const tbX = w / scale - tbW - 10;
    const tbY2 = h / scale - tbH - 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(tbX, tbY2, tbW, tbH);
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tbX, tbY2, tbW, tbH);

    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("STELLPLATZPLAN – ANLAGE 3", tbX + 8, tbY2 + 8);
    ctx.font = "9px Arial";
    ctx.fillText("zum Mobilitätskonzept", tbX + 8, tbY2 + 22);
    const today = new Date().toLocaleDateString("de-DE");
    ctx.fillText(`Maßstab 1:1.000 · Datum: ${today}`, tbX + 8, tbY2 + 38);
    ctx.fillText("Bearbeiter: neotopia", tbX + 8, tbY2 + 52);
    ctx.fillText("LHM Stellplatzsatzung 2025 · GaStellV Bayern", tbX + 8, tbY2 + 66);
    if (projectName) {
      ctx.fillText(`Projekt: ${projectName}`, tbX + 8, tbY2 + 80);
    }

    ctx.restore();
  }, [elements, selectedId, showGrid, scale, projectName]);

  /* ── Interactions ── */
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width) / scale,
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height) / scale,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);

    // Dimension tool – two-click
    if (selectedTool === "dimension") {
      if (!dimStart) {
        setDimStart({ x: snap(x), y: snap(y) });
        return;
      }
      const newEl: DrawElement = {
        id: crypto.randomUUID(),
        type: "dimension",
        x: dimStart.x,
        y: dimStart.y,
        width: 0,
        height: 0,
        label: "",
        color: "#374151",
        endX: snap(x),
        endY: snap(y),
      };
      const next = [...elements, newEl];
      setElements(next);
      pushHistory(next);
      setDimStart(null);
      return;
    }

    if (selectedTool === "select") {
      const clicked = [...elements].reverse().find((el) => {
        if (el.type === "dimension") {
          const ex = el.endX ?? el.x;
          const ey = el.endY ?? el.y;
          const dist =
            Math.abs((ey - el.y) * x - (ex - el.x) * y + ex * el.y - ey * el.x) /
            Math.sqrt((ey - el.y) ** 2 + (ex - el.x) ** 2);
          return dist < 8;
        }
        return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
      });
      setSelectedId(clicked?.id ?? null);
      return;
    }

    const tool = TOOLS.find((t) => t.id === selectedTool);
    if (!tool || tool.w === 0) return;
    const sx = snap(x - tool.w / 2);
    const sy = snap(y - tool.h / 2);
    const newEl: DrawElement = {
      id: crypto.randomUUID(),
      type: tool.id,
      x: sx,
      y: sy,
      width: tool.w,
      height: tool.h,
      label: tool.lbl,
      color: tool.color,
    };
    const next = [...elements, newEl];
    setElements(next);
    pushHistory(next);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "select") return;
    const { x, y } = getPos(e);
    const el = [...elements].reverse().find(
      (el) => el.type !== "dimension" && x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
    );
    if (el) {
      setDragging({ id: el.id, offsetX: x - el.x, offsetY: y - el.y });
      setSelectedId(el.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const { x, y } = getPos(e);
    setElements((prev) =>
      prev.map((el) =>
        el.id === dragging.id
          ? { ...el, x: snap(x - dragging.offsetX), y: snap(y - dragging.offsetY) }
          : el
      )
    );
  };

  const handleMouseUp = () => {
    if (dragging) {
      pushHistory(elements);
      setDragging(null);
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = elements.filter((el) => el.id !== selectedId);
    setElements(next);
    pushHistory(next);
    setSelectedId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.max(0.5, Math.min(4, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "Stellplatzplan_Anlage3_1zu1000.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportPdf = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window as any;
    if (!w.jspdf) {
      toast.error("jsPDF wird noch geladen – bitte erneut versuchen");
      return;
    }
    const doc = new w.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
    const imgData = canvas.toDataURL("image/png", 1.0);
    doc.addImage(imgData, "PNG", 10, 10, 400, 257);
    doc.setFontSize(8);
    doc.text(
      "Maßstab 1:1.000 – Anlage 3 Mobilitätskonzept – erzeugt mit neotopia Mobility Concept Studio",
      10,
      280
    );
    doc.save("Stellplatzplan_Anlage3_1zu1000.pdf");
  };

  const saveToProject = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas nicht verfügbar");
      // HINWEIS: Storage-Bucket "project-attachments" muss in Supabase Dashboard erstellt werden
      // Settings → Storage → New Bucket → "project-attachments" → Private (RLS)
      const blob = await new Promise<Blob>((res, rej) => {
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Blob-Fehler"))), "image/png");
      });
      const path = `projects/${projectId}/stellplatzplan_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("project-attachments").upload(path, blob);
      if (upErr) throw upErr;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("output_packages").insert({
        project_id: projectId,
        name: "Stellplatzplan",
        file_name: "Stellplatzplan_Anlage3_1zu1000.png",
        file_path: path,
        file_type: "image/png",
        file_size_bytes: blob.size,
        package_type: "Stellplatzplan",
        generated_by: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["output_packages", projectId] });
      toast.success("Stellplatzplan gespeichert");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <div className="space-y-3">
      {/* Warning */}
      <div className="flex items-start gap-2 border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 rounded-md px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-yellow-800 dark:text-yellow-200">
          Planzeichnungstool für Vorentwürfe. Maßstab 1:1.000 nach LBK München-Anforderungen.
          Maße nach GaStellV Bayern. Für den finalen Bauantrag empfehlen wir die Erstellung
          durch einen zugelassenen Architekten oder Vermessungsingenieur.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap border border-border rounded-md bg-card px-2 py-1.5">
        {TOOLS.map((tool) => (
          <Button
            key={tool.id}
            variant={selectedTool === tool.id ? "default" : "ghost"}
            size="sm"
            className="h-auto px-2 py-1 text-[11px] flex flex-col items-center gap-0"
            onClick={() => {
              setSelectedTool(tool.id);
              if (tool.id !== "dimension") setDimStart(null);
            }}
            title={tool.label}
          >
            <tool.icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline leading-tight">{tool.label}</span>
            {tool.sub && <span className="hidden lg:inline text-[9px] text-muted-foreground leading-tight">{tool.sub}</span>}
          </Button>
        ))}
        <div className="h-5 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={deleteSelected} disabled={!selectedId}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={undo} disabled={historyIndex <= 0}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant={showGrid ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-[11px]" onClick={() => setShowGrid(!showGrid)}>
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(scale * 100)}%</span>
        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={exportPng}>
          <Download className="h-3.5 w-3.5 mr-1" /> PNG
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={exportPdf}>
          PDF A3
        </Button>
        <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => saveToProject.mutate()} disabled={saveToProject.isPending}>
          <Save className="h-3.5 w-3.5 mr-1" /> {saveToProject.isPending ? "Speichert…" : "Speichern"}
        </Button>
      </div>

      {/* Dimension hint */}
      {selectedTool === "dimension" && (
        <p className="text-[11px] text-muted-foreground px-1">
          {dimStart ? "Klicke den Endpunkt der Maßkette" : "Klicke den Startpunkt der Maßkette"}
        </p>
      )}

      {/* Canvas */}
      <div className="border border-border rounded-md overflow-auto bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`block ${selectedTool !== "select" ? "cursor-crosshair" : "cursor-default"}`}
          style={{ width: CANVAS_W, height: CANVAS_H }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Maßstab 1:1.000 · Raster 5m/10m · Snap 0,5m · GaStellV Bayern · Scrollrad zum Zoomen · Elemente per Drag verschieben
      </p>
    </div>
  );
}
