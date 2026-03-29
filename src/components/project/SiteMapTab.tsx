import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Plus, Save, Trash2, Train, Bus } from "lucide-react";

declare const L: any;

interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  lines: string;
  takt_hvz: number;
}

interface SiteMapTabProps {
  site: any;
  projectId: string;
}

const TRANSIT_TYPES = ["Bus", "Tram", "U-Bahn", "S-Bahn", "RegBahn"];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function SiteMapTab({ site, projectId }: SiteMapTabProps) {
  const queryClient = useQueryClient();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [transitStops, setTransitStops] = useState<TransitStop[]>(() => {
    const meta = (site?.metadata as any) ?? {};
    return meta.transit_stops ?? [];
  });
  const [addMode, setAddMode] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stopName, setStopName] = useState("");
  const [stopType, setStopType] = useState("Bus");
  const [stopLines, setStopLines] = useState("");
  const [stopTakt, setStopTakt] = useState("10");

  // Geocode
  useEffect(() => {
    if (!site?.address) {
      setCenter([48.137, 11.576]); // Munich fallback
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(site.address)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        else setCenter([48.137, 11.576]);
      })
      .catch(() => setCenter([48.137, 11.576]));
  }, [site?.address]);

  // Init map
  useEffect(() => {
    if (!center || !mapContainerRef.current || typeof L === "undefined") return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView(center, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Site marker
    L.marker(center).addTo(map).bindPopup(`<b>${site?.name ?? "Standort"}</b><br/>${site?.address ?? ""}`);

    // Radii
    L.circle(center, { radius: 300, color: "#3b82f6", fillOpacity: 0.05, weight: 1 }).addTo(map);
    L.circle(center, { radius: 600, color: "#22c55e", fillOpacity: 0.05, weight: 1 }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, site?.name, site?.address]);

  // Transit stop markers
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const map = mapRef.current;

    // Remove existing transit markers (store in layer group)
    if ((map as any)._transitLayer) {
      (map as any)._transitLayer.clearLayers();
    }
    const group = L.layerGroup().addTo(map);
    (map as any)._transitLayer = group;

    transitStops.forEach(stop => {
      const dist = haversineDistance(center[0], center[1], stop.lat, stop.lng);
      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: 7,
        color: stop.type === "U-Bahn" || stop.type === "S-Bahn" ? "#7c3aed" : "#f59e0b",
        fillColor: stop.type === "U-Bahn" || stop.type === "S-Bahn" ? "#7c3aed" : "#f59e0b",
        fillOpacity: 0.8,
        weight: 2,
      });
      marker.bindPopup(`<b>${stop.name}</b><br/>${stop.type} · ${stop.lines}<br/>Takt HVZ: ${stop.takt_hvz} min<br/>Entfernung: ${Math.round(dist)} m`);
      group.addLayer(marker);

      // Line from center to stop
      L.polyline([center, [stop.lat, stop.lng]], { color: "#94a3b8", weight: 1, dashArray: "4 4" }).addTo(group);
    });
  }, [transitStops, center]);

  // Click handler for adding stops
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handler = (e: any) => {
      if (!addMode) return;
      setPendingLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
      setDialogOpen(true);
      setAddMode(false);
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [addMode]);

  const addStop = () => {
    if (!pendingLatLng || !stopName.trim()) return;
    const newStop: TransitStop = {
      id: crypto.randomUUID(),
      name: stopName.trim(),
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      type: stopType,
      lines: stopLines.trim(),
      takt_hvz: parseInt(stopTakt) || 10,
    };
    setTransitStops(prev => [...prev, newStop]);
    setDialogOpen(false);
    setStopName(""); setStopType("Bus"); setStopLines(""); setStopTakt("10");
    setPendingLatLng(null);
  };

  const removeStop = (id: string) => {
    setTransitStops(prev => prev.filter(s => s.id !== id));
  };

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_sites").update({
        metadata: { ...((site?.metadata as any) ?? {}), transit_stops: transitStops },
      }).eq("id", site.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-sites", projectId] });
      toast.success("ÖPNV-Daten gespeichert");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  // ÖPNV status
  const oepnvStatus = (() => {
    if (!center) return false;
    return transitStops.some(stop => {
      const dist = haversineDistance(center[0], center[1], stop.lat, stop.lng);
      if (dist <= 300) return true;
      if ((stop.type === "U-Bahn" || stop.type === "S-Bahn") && dist <= 600 && stop.takt_hvz <= 10) return true;
      return false;
    });
  })();

  if (!site) {
    return (
      <div className="border border-border rounded-md bg-card p-6 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-[13px] text-muted-foreground">Kein Standort vorhanden. Bitte zuerst einen Standort anlegen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-medium text-foreground">Standortkarte & ÖPNV-Nachweis</h3>
          <Badge variant={oepnvStatus ? "default" : "destructive"} className="text-[11px]">
            {oepnvStatus ? "✓ ÖPNV-Nachweis erfüllt" : "✗ ÖPNV-Nachweis ausstehend"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={addMode ? "default" : "outline"}
            size="sm"
            className="h-8 text-[13px]"
            onClick={() => setAddMode(!addMode)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {addMode ? "Klicken Sie auf die Karte…" : "Haltestelle hinzufügen"}
          </Button>
          <Button size="sm" className="h-8 text-[13px]" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {saveMutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        id="leaflet-map"
        className={`h-[450px] rounded-md border border-border ${addMode ? "cursor-crosshair" : ""}`}
        style={{ zIndex: 0 }}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> 300m Radius</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> 600m Radius</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> Bus/Tram</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-violet-600 inline-block" /> U-/S-Bahn</span>
      </div>

      {/* Transit stops table */}
      {transitStops.length > 0 && (
        <div className="border border-border rounded-md bg-card">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[12px] font-medium text-foreground">Erfasste Haltestellen ({transitStops.length})</p>
          </div>
          <div className="divide-y divide-border">
            {transitStops.map(stop => {
              const dist = center ? Math.round(haversineDistance(center[0], center[1], stop.lat, stop.lng)) : 0;
              return (
                <div key={stop.id} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {stop.type === "U-Bahn" || stop.type === "S-Bahn" ? (
                      <Train className="h-3.5 w-3.5 text-violet-600" />
                    ) : (
                      <Bus className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{stop.name}</p>
                      <p className="text-[11px] text-muted-foreground">{stop.type} · {stop.lines} · Takt {stop.takt_hvz} min · {dist} m</p>
                    </div>
                  </div>
                  <button onClick={() => removeStop(stop.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add stop dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px]">Haltestelle hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Name *</Label>
              <Input value={stopName} onChange={e => setStopName(e.target.value)} placeholder="z. B. Leuchtenbergring" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Typ</Label>
              <Select value={stopType} onValueChange={setStopType}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSIT_TYPES.map(t => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Linien</Label>
              <Input value={stopLines} onChange={e => setStopLines(e.target.value)} placeholder="z. B. S1, S8" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Takt HVZ (Minuten)</Label>
              <Input type="number" value={stopTakt} onChange={e => setStopTakt(e.target.value)} className="h-9 text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-[13px]">Abbrechen</Button>
            <Button size="sm" onClick={addStop} disabled={!stopName.trim()} className="text-[13px]">Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
