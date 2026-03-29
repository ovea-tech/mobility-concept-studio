import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MousePointer2, Square, Accessibility, Bike, Zap, Car,
  Package, Type, Minus, Trash2, Undo2, Redo2, Grid3X3, Download, Save,
} from "lucide-react";

interface DrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

interface PlanDrawingTabProps {
  projectId: string;
}

const TOOLS = [
  { id: "select", label: "Auswählen", icon: MousePointer2, color: "", w: 0, h: 0, lbl: "" },
  { id: "parking_car", label: "PKW-Stellplatz", icon: Square, color: "#9ca3af", w: 25, h: 50, lbl: "P" },
  { id: "parking_disabled", label: "Behinderten-StP", icon: Accessibility, color: "#3b82f6", w: 35, h: 50, lbl: "♿" },
  { id: "parking_bike", label: "Fahrrad-StP", icon: Bike, color: "#eab308", w: 20, h: 20, lbl: "🚲" },
  { id: "ev_charger", label: "E-Ladesäule", icon: Zap, color: "#22c55e", w: 25, h: 50, lbl: "⚡" },
  { id: "sharing_area", label: "Sharing-Fläche", icon: Package, color: "#22c55e", w: 60, h: 40, lbl: "SHARING" },
  { id: "carsharing", label: "Carsharing-StP", icon: Car, color: "#06b6d4", w: 25, h: 50, lbl: "CS" },
  { id: "cargo_bike", label: "Lastenrad", icon: Package, color: "#f97316", w: 25, h: 30, lbl: "LR" },
  { id: "text", label: "Text", icon: Type, color: "#374151", w: 60, h: 20, lbl: "Text" },
  { id: "dimension_line", label: "Linie", icon: Minus, color: "#374151", w: 80, h: 2, lbl: "" },
];

export function PlanDrawingTab({ projectId }: PlanDrawingTabProps) {
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

  const pushHistory = useCallback((newElements: DrawElement[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newElements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setElements(history[newIndex]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setElements(history[newIndex]);
  };

  // Draw canvas
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

    // Grid
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 0.5;
      const gridSize = 10; // 10px = 1m at 1:200
      for (let x = 0; x < w / scale; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h / scale); ctx.stroke();
      }
      for (let y = 0; y < h / scale; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w / scale, y); ctx.stroke();
      }
    }

    // Elements
    elements.forEach(el => {
      const isSelected = el.id === selectedId;
      ctx.fillStyle = el.color + "40";
      ctx.strokeStyle = isSelected ? "#2563eb" : el.color;
      ctx.lineWidth = isSelected ? 2 : 1;

      if (el.type === "sharing_area") {
        ctx.setLineDash([4, 4]);
      } else if (el.type === "dimension_line") {
        ctx.setLineDash([]);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.scale(scale, scale);
        return;
      } else {
        ctx.setLineDash([]);
      }

      ctx.fillRect(el.x, el.y, el.width, el.height);
      ctx.strokeRect(el.x, el.y, el.width, el.height);
      ctx.setLineDash([]);

      // Label
      if (el.label) {
        ctx.fillStyle = "#1f2937";
        ctx.font = `${Math.min(12, el.height * 0.6)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label, el.x + el.width / 2, el.y + el.height / 2);
      }
    });

    ctx.restore();
  }, [elements, selectedId, showGrid, scale]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (selectedTool === "select") {
      // Find element under cursor
      const clicked = [...elements].reverse().find(el =>
        x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
      );
      setSelectedId(clicked?.id ?? null);
      return;
    }

    // Place new element
    const tool = TOOLS.find(t => t.id === selectedTool);
    if (!tool) return;
    const newEl: DrawElement = {
      id: crypto.randomUUID(),
      type: tool.id,
      x: x - tool.w / 2,
      y: y - tool.h / 2,
      width: tool.w,
      height: tool.h,
      label: tool.lbl,
      color: tool.color,
    };
    const newElements = [...elements, newEl];
    setElements(newElements);
    pushHistory(newElements);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "select") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const el = [...elements].reverse().find(el =>
      x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
    );
    if (el) {
      setDragging({ id: el.id, offsetX: x - el.x, offsetY: y - el.y });
      setSelectedId(el.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setElements(prev => prev.map(el =>
      el.id === dragging.id ? { ...el, x: x - dragging.offsetX, y: y - dragging.offsetY } : el
    ));
  };

  const handleMouseUp = () => {
    if (dragging) {
      pushHistory(elements);
      setDragging(null);
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const newElements = elements.filter(el => el.id !== selectedId);
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.5, Math.min(4, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "Stellplatzplan_Anlage3.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const saveToProject = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas nicht verfügbar");
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Blob-Fehler")), "image/png");
      });
      const path = `projects/${projectId}/stellplatzplan_${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("project-attachments").upload(path, blob);
      if (upErr) throw upErr;

      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("output_packages").insert({
        project_id: projectId,
        name: "Stellplatzplan",
        file_name: "Stellplatzplan_Anlage3.png",
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
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap border border-border rounded-md bg-card px-2 py-1.5">
        {TOOLS.map(tool => (
          <Button
            key={tool.id}
            variant={selectedTool === tool.id ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => setSelectedTool(tool.id)}
            title={tool.label}
          >
            <tool.icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline ml-1">{tool.label}</span>
          </Button>
        ))}
        <div className="h-5 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={deleteSelected} disabled={!selectedId} title="Löschen">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={undo} disabled={historyIndex <= 0} title="Undo">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant={showGrid ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-[11px]" onClick={() => setShowGrid(!showGrid)} title="Raster">
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(scale * 100)}%</span>
        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={exportPng}>
          <Download className="h-3.5 w-3.5 mr-1" /> PNG
        </Button>
        <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => saveToProject.mutate()} disabled={saveToProject.isPending}>
          <Save className="h-3.5 w-3.5 mr-1" /> {saveToProject.isPending ? "Speichert…" : "Speichern"}
        </Button>
      </div>

      {/* Canvas */}
      <div className="border border-border rounded-md overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`w-full ${selectedTool !== "select" ? "cursor-crosshair" : "cursor-default"}`}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">Raster: 10px = 1m (Maßstab 1:200). Scrollrad zum Zoomen. Elemente per Drag verschieben.</p>
    </div>
  );
}
