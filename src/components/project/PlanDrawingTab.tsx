import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MousePointer2, Square, Accessibility, Bike, Zap, Car,
  Package, Type, Minus, Trash2, Undo2, Redo2, Grid3X3, Download, Save,
  Ruler, AlertTriangle, FileText,
} from "lucide-react";

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
  siteAddress?: string | null;
}

/* ── Constants (module-level) ── */
const SCALE_1_1000 = 5; // 5px = 1 Meter bei Maßstab 1:1.000
const SNAP = SCALE_1_1000; // snap to 1m grid (= 5px)
const snap = (v: number) => Math.round(v / SNAP) * SNAP;

const TOOLS = [
  { id: "select",        label: "Auswählen",               sub: "",              icon: MousePointer2, color: "",        w: 0,                   h: 0,                   lbl: "" },
  { id: "parking_car",   label: "PKW-StP (2,30×5,00m)",    sub: "2,30×5,00m",    icon: Square,        color: "#9ca3af", w: 2.3 * SCALE_1_1000,  h: 5.0 * SCALE_1_1000,  lbl: "P" },
  { id: "parking_wide",  label: "PKW-StP (2,50×5,00m)",    sub: "2,50×5,00m",    icon: Square,        color: "#9ca3af", w: 2.5 * SCALE_1_1000,  h: 5.0 * SCALE_1_1000,  lbl: "P" },
  { id: "parking_disabled", label: "Behinderten (3,50×5,00m)", sub: "3,50×5,00m", icon: Accessibility, color: "#3b82f6", w: 3.5 * SCALE_1_1000, h: 5.0 * SCALE_1_1000,  lbl: "♿" },
  { id: "aisle",          label: "Fahrgasse (6,50m)",       sub: "6,50m breit",   icon: Minus,         color: "#f9fafb", w: 6.5 * SCALE_1_1000,  h: 20 * SCALE_1_1000,   lbl: "" },
  { id: "parking_bike",  label: "Fahrrad-StP (0,6×1,8m)",  sub: "0,60×1,80m",    icon: Bike,          color: "#eab308", w: 0.6 * SCALE_1_1000,  h: 1.8 * SCALE_1_1000,  lbl: "🚲" },
  { id: "bike_row",      label: "Fahrrad-Reihe (5×)",      sub: "3,00×1,80m",    icon: Bike,          color: "#eab308", w: 3.0 * SCALE_1_1000,  h: 1.8 * SCALE_1_1000,  lbl: "🚲×5" },
  { id: "ev_charger",    label: "E-Ladesäule (2,30×5,00m)",sub: "2,30×5,00m",    icon: Zap,           color: "#22c55e", w: 2.3 * SCALE_1_1000,  h: 5.0 * SCALE_1_1000,  lbl: "⚡" },
  { id: "sharing_area",  label: "Sharing-Fläche",          sub: "frei",          icon: Package,       color: "#22c55e", w: 10 * SCALE_1_1000,   h: 5.0 * SCALE_1_1000,  lbl: "SHARING" },
  { id: "carsharing",    label: "Carsharing-StP (2,50×5m)",sub: "2,50×5,00m",    icon: Car,           color: "#06b6d4", w: 2.5 * SCALE_1_1000,  h: 5.0 * SCALE_1_1000,  lbl: "CS" },
  { id: "cargo_bike",    label: "Lastenrad-Station",       sub: "4,00×2,00m",    icon: Package,       color: "#f97316", w: 4.0 * SCALE_1_1000,  h: 2.0 * SCALE_1_1000,  lbl: "LR" },
  { id: "building",      label: "Gebäude / Baukörper",     sub: "frei",          icon: Square,        color: "#6b7280", w: 20 * SCALE_1_1000,   h: 15 * SCALE_1_1000,   lbl: "" },
  { id: "north_arrow",   label: "Nordpfeil",               sub: "",              icon: Type,          color: "#374151", w: 3.0 * SCALE_1_1000,  h: 3.0 * SCALE_1_1000,  lbl: "N↑" },
  { id: "text",          label: "Beschriftung",            sub: "",              icon: Type,          color: "#374151", w: 8.0 * SCALE_1_1000,  h: 2.0 * SCALE_1_1000,  lbl: "Text" },
  { id: "dimension",     label: "Maßlinie",               sub: "",              icon: Ruler,         color: "#374151", w: 0,                   h: 0,                   lbl: "" },
];

const CANVAS_W = 1400;
const CANVAS_H = 990;

export function PlanDrawingTab({ projectId, projectName, siteAddress }: PlanDrawingTabProps) {
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
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [showBg, setShowBg] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);

  const loadOsmBackground = useCallback(async () => {
    if (!siteAddress) {
      toast.error("Standort im Schritt 'Grundlage' hinterlegen für automatischen Hintergrund");
      return;
    }
    setBgLoading(true);
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(siteAddress)}&format=json&limit=1`);
      const geoData = await geo.json();
      if (!geoData?.[0]) { toast.error("Adresse nicht gefunden"); return; }
      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);
      const z = 18;
      const tileX = Math.floor(((lon + 180) / 360) * Math.pow(2, z));
      const tileY = Math.floor(
        ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
          Math.pow(2, z)
      );
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { setBgImage(img); setBgLoading(false); toast.success("Katasterplan geladen"); };
      img.onerror = () => { setBgImage(null); setBgLoading(false); toast.error("Hintergrundkachel konnte nicht geladen werden"); };
      img.src = `https://tile.openstreetmap.org/${z}/${tileX}/${tileY}.png`;
    } catch {
      setBgLoading(false);
      toast.error("Hintergrund-Laden fehlgeschlagen");
    }
  }, [siteAddress]);


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

  const S = SCALE_1_1000; // shorthand for drawing

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

    const sw = w / scale;
    const sh = h / scale;

    // Background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, sw, sh);

    // OSM Katasterplan-Hintergrund (optional, leicht transparent)
    if (bgImage && showBg) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      const tileSize = 256;
      ctx.drawImage(bgImage, (sw - tileSize) / 2, (sh - tileSize) / 2, tileSize, tileSize);
      ctx.restore();
    }

    // Grid
    if (showGrid) {
      for (let x = 0; x <= sw; x += S) {
        const isMajor = x % (10 * S) === 0; // every 10m
        const isMid = x % (5 * S) === 0;    // every 5m
        ctx.strokeStyle = isMajor ? "#d1d5db" : isMid ? "#e5e7eb" : "#eeeff1";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, sh);
        ctx.stroke();
      }
      for (let y = 0; y <= sh; y += S) {
        const isMajor = y % (10 * S) === 0;
        const isMid = y % (5 * S) === 0;
        ctx.strokeStyle = isMajor ? "#d1d5db" : isMid ? "#e5e7eb" : "#eeeff1";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(sw, y);
        ctx.stroke();
      }
      // Grid labels every 10m
      ctx.fillStyle = "#9ca3af";
      ctx.font = `${1.5 * S}px Arial`;
      ctx.textAlign = "left";
      for (let x = 10 * S; x < sw; x += 10 * S) {
        ctx.fillText(`${x / S}m`, x + 2, 2 * S);
      }
      ctx.textAlign = "right";
      for (let y = 10 * S; y < sh; y += 10 * S) {
        ctx.fillText(`${y / S}m`, sw - S, y - 1);
      }
    }

    // Elements
    elements.forEach((el) => {
      const isSel = el.id === selectedId;
      ctx.setLineDash([]);

      if (el.type === "dimension") {
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
        // End ticks
        const perpAngle = angle + Math.PI / 2;
        const tickLen = 4;
        for (const [px, py] of [[el.x, el.y], [ex, ey]]) {
          ctx.beginPath();
          ctx.moveTo(px - tickLen * Math.cos(perpAngle), py - tickLen * Math.sin(perpAngle));
          ctx.lineTo(px + tickLen * Math.cos(perpAngle), py + tickLen * Math.sin(perpAngle));
          ctx.stroke();
        }
        // Distance label
        const distPx = Math.sqrt((ex - el.x) ** 2 + (ey - el.y) ** 2);
        const distM = (distPx / S).toFixed(2).replace(".", ",");
        ctx.fillStyle = "#1f2937";
        ctx.font = `bold ${1.8 * S}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${distM} m`, (el.x + ex) / 2, (el.y + ey) / 2 - 3);
        return;
      }

      if (el.type === "sharing_area") {
        ctx.setLineDash([6, 3]);
        ctx.fillStyle = "rgba(34,197,94,0.15)";
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "aisle") {
        ctx.fillStyle = "rgba(156,163,175,0.08)";
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "building") {
        ctx.fillStyle = "rgba(107,114,128,0.12)";
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
        for (let d = 0; d < el.width + el.height; d += 4) {
          ctx.beginPath();
          ctx.moveTo(el.x + Math.min(d, el.width), el.y + Math.max(0, d - el.width));
          ctx.lineTo(el.x + Math.max(0, d - el.height), el.y + Math.min(d, el.height));
          ctx.stroke();
        }
      }

      // Label
      if (el.label) {
        ctx.fillStyle = "#1f2937";
        const fontSize = Math.min(2 * S, el.height * 0.6, el.width * 0.3);
        ctx.font = `${Math.max(1.2 * S, fontSize)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label, el.x + el.width / 2, el.y + el.height / 2, el.width - 2);
      }
    });

    // Dimension lines for selected element
    const selEl = elements.find((e) => e.id === selectedId);
    if (selEl && !["text", "dimension", "select", "north_arrow"].includes(selEl.type)) {
      const rW = (selEl.width / S).toFixed(2);
      const rH = (selEl.height / S).toFixed(2);
      const off = 3 * S;
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      // Horizontal dimension (top)
      ctx.beginPath(); ctx.moveTo(selEl.x, selEl.y - off); ctx.lineTo(selEl.x + selEl.width, selEl.y - off); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(selEl.x, selEl.y - off - S); ctx.lineTo(selEl.x, selEl.y - off + S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(selEl.x + selEl.width, selEl.y - off - S); ctx.lineTo(selEl.x + selEl.width, selEl.y - off + S); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#2563eb";
      ctx.font = `${1.8 * S}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${rW} m`, selEl.x + selEl.width / 2, selEl.y - off);
      // Vertical dimension (right)
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(selEl.x + selEl.width + off, selEl.y); ctx.lineTo(selEl.x + selEl.width + off, selEl.y + selEl.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(selEl.x + selEl.width + off - S, selEl.y); ctx.lineTo(selEl.x + selEl.width + off + S, selEl.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(selEl.x + selEl.width + off - S, selEl.y + selEl.height); ctx.lineTo(selEl.x + selEl.width + off + S, selEl.y + selEl.height); ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${rH} m`, selEl.x + selEl.width + off + S, selEl.y + selEl.height / 2);
    }

    // Scale bar (bottom left)
    const seg = 10 * S;
    const sbX = 2 * S;
    const sbY = sh - 8 * S;
    ctx.fillStyle = "#374151";
    ctx.fillRect(sbX, sbY, seg, 1.5 * S);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sbX + seg, sbY, seg, 1.5 * S);
    ctx.fillStyle = "#374151";
    ctx.fillRect(sbX + 2 * seg, sbY, seg, 1.5 * S);
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sbX, sbY, 3 * seg, 1.5 * S);
    ctx.font = `${1.5 * S}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ["0", "10m", "20m", "30m"].forEach((lbl, i) => ctx.fillText(lbl, sbX + i * seg, sbY + 2 * S));

    // North arrow (top right)
    const nX = sw - 4 * S;
    ctx.fillStyle = "#374151";
    ctx.font = `bold ${2 * S}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("N", nX, 3 * S);
    ctx.beginPath();
    ctx.moveTo(nX, 3.5 * S);
    ctx.lineTo(nX - 1.5 * S, 6 * S);
    ctx.lineTo(nX + 1.5 * S, 6 * S);
    ctx.closePath();
    ctx.fill();

    // Schriftfeld (title block) bottom right
    const fw = 80 * S;
    const fh = 20 * S;
    const fx = sw - fw - 2 * S;
    const fy = sh - fh - 2 * S;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.beginPath(); ctx.moveTo(fx, fy + 8 * S); ctx.lineTo(fx + fw, fy + 8 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx, fy + 14 * S); ctx.lineTo(fx + fw, fy + 14 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 35 * S, fy); ctx.lineTo(fx + 35 * S, fy + fh); ctx.stroke();

    ctx.fillStyle = "#374151";
    ctx.font = `${1.8 * S}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Maßstab: 1:1.000", fx + 1 * S, fy + 1 * S);
    ctx.fillText("Datum: " + new Date().toLocaleDateString("de-DE"), fx + 1 * S, fy + 9 * S);
    ctx.fillText("neotopia Mobility Studio", fx + 1 * S, fy + 15 * S);
    ctx.fillText("Anlage 3 – PKW/Rad/Sharing-Stellplätze", fx + 36 * S, fy + 1 * S);
    ctx.fillText("GaStellV Bayern §4 konform", fx + 36 * S, fy + 9 * S);
    if (projectName) {
      ctx.fillText(`Projekt: ${projectName}`, fx + 36 * S, fy + 15 * S);
    }

    ctx.restore();
  }, [elements, selectedId, showGrid, scale, projectName, S, bgImage, showBg]);

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

    if (selectedTool === "dimension") {
      if (!dimStart) {
        setDimStart({ x: snap(x), y: snap(y) });
        return;
      }
      const newEl: DrawElement = {
        id: crypto.randomUUID(),
        type: "dimension",
        x: dimStart.x, y: dimStart.y,
        width: 0, height: 0, label: "", color: "#374151",
        endX: snap(x), endY: snap(y),
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
      type: tool.id, x: sx, y: sy,
      width: tool.w, height: tool.h,
      label: tool.lbl, color: tool.color,
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
    link.download = "Stellplatzplan_Anlage3_M1-1000.png";
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
    doc.addImage(imgData, "PNG", 0, 0, 420, 297);
    doc.save("Stellplatzplan_Anlage3_M1-1000.pdf");
  };

  const saveToProject = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas nicht verfügbar");
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
        file_name: "Stellplatzplan_Anlage3_M1-1000.png",
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
            <span className="hidden lg:inline leading-tight">{tool.label.split(" ")[0]}</span>
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
        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={exportPdf} title="PDF A3 exportieren">
          <FileText className="h-3.5 w-3.5 mr-1" /> PDF A3
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
        Maßstab 1:1.000 · GaStellV Bayern §4: PKW mind. 2,30×5,00m, Behinderten 3,50×5,00m, Fahrgasse mind. 6,00m · Für Bauantrag Prüfung durch Architekten empfohlen
      </p>
    </div>
  );
}
