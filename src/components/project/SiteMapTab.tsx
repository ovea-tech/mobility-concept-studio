import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, RefreshCw } from "lucide-react";

/* ── Overpass cache (module-level) ── */
const OVERPASS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage
const memCache = new Map<string, { stops: TransitStop[]; pois: NahversorgungPoi[]; ts: number }>();
function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

declare const L: any;

interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "U-Bahn" | "S-Bahn" | "Tram" | "Bus";
  lines: string;
  takt_hvz: number;
  source: "overpass" | "manual";
}

interface NahversorgungPoi {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

interface SiteMapTabProps {
  site?: { id: string; address?: string | null; name: string; metadata?: any } | null;
  projectId: string;
}

const STOP_COLORS: Record<string, string> = {
  "U-Bahn": "#7c3aed",
  "S-Bahn": "#059669",
  "Tram": "#d97706",
  "Bus": "#3b82f6",
};

const STOP_RADII: Record<string, number> = {
  "U-Bahn": 9,
  "S-Bahn": 9,
  "Tram": 7,
  "Bus": 5,
};

const NAH_ICONS: Record<string, string> = {
  supermarket: "🛒",
  convenience: "🛒",
  pharmacy: "💊",
  doctors: "🏥",
  bakery: "🥖",
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectType(tags: any): TransitStop["type"] {
  if (!tags) return "Bus";
  if (tags.station === "subway" || tags.network?.includes("U-Bahn")) return "U-Bahn";
  if (tags.network?.includes("S-Bahn") || tags.railway === "halt") return "S-Bahn";
  if (tags.railway === "tram_stop" || tags.tram === "yes") return "Tram";
  if (tags.railway === "station") return "S-Bahn";
  return "Bus";
}

function detectNahType(tags: any): string {
  if (tags?.shop === "supermarket") return "supermarket";
  if (tags?.shop === "convenience") return "convenience";
  if (tags?.amenity === "pharmacy") return "pharmacy";
  if (tags?.amenity === "doctors") return "doctors";
  if (tags?.shop === "bakery") return "bakery";
  return "supermarket";
}

export function SiteMapTab({ site, projectId }: SiteMapTabProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [center, setCenter] = useState<[number, number] | null>(null);
  const [autoStops, setAutoStops] = useState<TransitStop[]>([]);
  const [transitStops, setTransitStops] = useState<TransitStop[]>(() => {
    const saved = site?.metadata?.transit_stops;
    return Array.isArray(saved) ? saved : [];
  });
  const [nahversorgung, setNahversorgung] = useState<NahversorgungPoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [overpassLoading, setOverpassLoading] = useState(false);
  const [addStopMode, setAddStopMode] = useState(false);
  const [pendingClick, setPendingClick] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStop, setNewStop] = useState({ name: "", type: "Bus" as TransitStop["type"], lines: "", takt_hvz: 10 });
  const [saving, setSaving] = useState(false);
  const [cacheSource, setCacheSource] = useState<"memory" | "db" | "fresh" | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const allStops = [...autoStops, ...transitStops];

  const oepnvStatus = center
    ? allStops.some((s) => {
        const dist = haversineDistance(center[0], center[1], s.lat, s.lng);
        if (s.type === "U-Bahn" || s.type === "S-Bahn") return dist <= 600 && s.takt_hvz <= 10;
        if (s.type === "Tram") return dist <= 400;
        return dist <= 300;
      })
    : false;

  // Geocoding
  useEffect(() => {
    if (!site?.address) {
      setLoading(false);
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(site.address)}&format=json&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      })
      .catch(() => toast.error("Geocoding fehlgeschlagen"))
      .finally(() => setLoading(false));
  }, [site?.address]);

  // Overpass with caching (memory + DB)
  useEffect(() => {
    if (!center) return;
    const [lat, lon] = center;
    const k = cacheKey(lat, lon);

    // 1) memory cache
    const mem = memCache.get(k);
    if (mem && Date.now() - mem.ts < OVERPASS_TTL_MS) {
      setAutoStops(mem.stops);
      setNahversorgung(mem.pois);
      setCacheSource("memory");
      return;
    }
    // 2) DB cache
    const dbCache = (site?.metadata as any)?.overpass_cache;
    if (dbCache && dbCache.key === k && Date.now() - dbCache.ts < OVERPASS_TTL_MS && Array.isArray(dbCache.stops)) {
      memCache.set(k, { stops: dbCache.stops, pois: dbCache.pois ?? [], ts: dbCache.ts });
      setAutoStops(dbCache.stops);
      setNahversorgung(dbCache.pois ?? []);
      setCacheSource("db");
      return;
    }

    // 3) fetch fresh — combined query nach StPlS München 2025
    setOverpassLoading(true);
    const query = `[out:json][timeout:30];
(
  node["railway"="station"]["station"!="light_rail"](around:700,${lat},${lon});
  node["railway"="halt"](around:700,${lat},${lon});
  node["station"="subway"](around:700,${lat},${lon});
  node["railway"="tram_stop"](around:500,${lat},${lon});
  node["highway"="bus_stop"](around:400,${lat},${lon});
  node["public_transport"="platform"]["bus"="yes"](around:400,${lat},${lon});
  nwr["shop"="supermarket"](around:500,${lat},${lon});
  nwr["shop"="convenience"](around:500,${lat},${lon});
  nwr["shop"="bakery"](around:400,${lat},${lon});
  nwr["amenity"="pharmacy"](around:500,${lat},${lon});
  nwr["amenity"="doctors"](around:500,${lat},${lon});
  nwr["amenity"="clinic"](around:500,${lat},${lon});
  nwr["amenity"="school"](around:600,${lat},${lon});
  nwr["amenity"="kindergarten"](around:500,${lat},${lon});
);
out center;`;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((r) => r.json())
      .then(async (data) => {
        const seen = new Set<string>();
        const stops: TransitStop[] = [];
        const pois: NahversorgungPoi[] = [];
        for (const el of data.elements || []) {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) continue;
          const tags = el.tags || {};
          const isTransit =
            tags.railway === "station" || tags.railway === "halt" || tags.railway === "tram_stop" ||
            tags.station === "subway" || tags.highway === "bus_stop" || tags.public_transport === "platform";
          if (isTransit) {
            const key = `${elLat.toFixed(4)}_${elLng.toFixed(4)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const type = detectType(tags);
            stops.push({
              id: "osm_" + el.id.toString(),
              name: tags.name || tags["name:de"] || "Haltestelle",
              lat: elLat, lng: elLng, type,
              lines: tags.ref || tags.route_ref || "",
              takt_hvz: type === "U-Bahn" || type === "S-Bahn" ? 10 : 20,
              source: "overpass",
            });
          } else {
            pois.push({
              id: "am_" + el.id.toString(),
              name: tags.name || tags.brand || "Nahversorgung",
              lat: elLat, lng: elLng, type: detectNahType(tags),
            });
          }
        }
        setAutoStops(stops);
        setNahversorgung(pois);
        setCacheSource("fresh");
        const ts = Date.now();
        memCache.set(k, { stops, pois, ts });
        // persist
        if (site?.id) {
          await supabase.from("project_sites").update({
            metadata: { ...(site.metadata as any || {}), overpass_cache: { key: k, stops, pois, ts } },
          }).eq("id", site.id);
        }
      })
      .catch(() => toast.error("Overpass-API nicht erreichbar – bitte Haltestellen manuell erfassen"))
      .finally(() => setOverpassLoading(false));
  }, [center, refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshOverpass = () => {
    if (!center) return;
    memCache.delete(cacheKey(center[0], center[1]));
    setRefreshTick((n) => n + 1);
  };

  // Map init – multi-layer (OSM / Esri Satellit / optional Thunderforest)
  useEffect(() => {
    if (!center || !mapRef.current || typeof L === "undefined") return;
    if (mapInstance.current) {
      mapInstance.current.setView(center, 15);
      return;
    }
    const map = L.map(mapRef.current).setView(center, 15);

    const TF_KEY = (import.meta as any).env?.VITE_THUNDERFOREST_API_KEY as string | undefined;

    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    });
    const transportLayer = TF_KEY
      ? L.tileLayer(`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${TF_KEY}`, {
          attribution: "© Thunderforest © OpenStreetMap", maxZoom: 22,
        })
      : null;
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri World Imagery", maxZoom: 19 }
    );

    (transportLayer ?? osmLayer).addTo(map);

    const baseLayers: Record<string, any> = {
      "Standard (OSM)": osmLayer,
      "Satellit (Esri)": satelliteLayer,
    };
    if (transportLayer) baseLayers["ÖPNV (Thunderforest)"] = transportLayer;
    L.control.layers(baseLayers, undefined, { position: "topright", collapsed: true }).addTo(map);

    if (!TF_KEY) {
      const warn = L.control({ position: "topleft" });
      warn.onAdd = () => {
        const div = L.DomUtil.create("div", "leaflet-bar");
        div.style.cssText = "background:#fef3c7;color:#92400e;padding:4px 8px;font-size:11px;border:1px solid #fde68a;border-radius:4px;max-width:240px;line-height:1.3;";
        div.innerHTML = "ÖPNV-Layer deaktiviert. Setze VITE_THUNDERFOREST_API_KEY in .env";
        return div;
      };
      warn.addTo(map);
    }

    mapInstance.current = map;
    map.on("click", (e: any) => {
      if (!(window as any).__addStopMode) return;
      setPendingClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowAddDialog(true);
    });
  }, [center]);

  useEffect(() => {
    (window as any).__addStopMode = addStopMode;
    if (mapInstance.current) mapInstance.current.getContainer().style.cursor = addStopMode ? "crosshair" : "";
  }, [addStopMode]);

  // Markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !center) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Site marker
    const sm = L.marker(center).addTo(map);
    sm.bindPopup(`<b>${site?.name || "Standort"}</b><br/>${site?.address || ""}`);
    markersRef.current.push(sm);

    // 3 radii circles (StPlS)
    markersRef.current.push(L.circle(center, { radius: 300, color: "#3b82f6", fillOpacity: 0.04, weight: 1.5, dashArray: "6 3" }).addTo(map));
    markersRef.current.push(L.circle(center, { radius: 400, color: "#d97706", fillOpacity: 0.03, weight: 1.5, dashArray: "6 3" }).addTo(map));
    markersRef.current.push(L.circle(center, { radius: 600, color: "#7c3aed", fillOpacity: 0.03, weight: 1.5 }).addTo(map));

    // Auto stops (Overpass)
    autoStops.forEach((s) => {
      const dist = Math.round(haversineDistance(center[0], center[1], s.lat, s.lng));
      const color = STOP_COLORS[s.type] || "#6b7280";
      const radius = STOP_RADII[s.type] || 6;
      const m = L.circleMarker([s.lat, s.lng], {
        radius, fillColor: color, fillOpacity: 0.85, color, weight: 2,
      }).addTo(map);
      m.bindPopup(`<b>${s.name}</b><br/>${s.type}${s.lines ? " · " + s.lines : ""}<br/>Takt HVZ: ${s.takt_hvz} min<br/>Entfernung: ${dist} m`);
      markersRef.current.push(m);
    });

    // Manual stops
    transitStops.forEach((s) => {
      const dist = Math.round(haversineDistance(center[0], center[1], s.lat, s.lng));
      const color = STOP_COLORS[s.type] || "#6b7280";
      const m = L.circleMarker([s.lat, s.lng], { radius: 10, fillColor: color, fillOpacity: 0.9, color, weight: 2 }).addTo(map);
      m.bindPopup(`<b>${s.name}</b> <i>(manuell)</i><br/>${s.type} · Linien: ${s.lines || "–"}<br/>Entfernung: ${dist} m<br/>Takt HVZ: ${s.takt_hvz} min`);
      markersRef.current.push(m);
    });

    // Nahversorgung as small green squares
    nahversorgung.forEach((p) => {
      const dist = Math.round(haversineDistance(center[0], center[1], p.lat, p.lng));
      const icon = L.divIcon({
        html: `<div title="${p.name}" style="background:#22c55e;width:8px;height:8px;border:1.5px solid white;border-radius:2px;cursor:pointer"></div>`,
        className: "",
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
      m.bindPopup(`<b>${p.name}</b><br/>${p.type} · ${dist} m`);
      markersRef.current.push(m);
    });
  }, [center, autoStops, transitStops, nahversorgung, site]);

  const addManualStop = () => {
    if (!pendingClick) return;
    const stop: TransitStop = { id: crypto.randomUUID(), name: newStop.name || "Haltestelle", lat: pendingClick.lat, lng: pendingClick.lng, type: newStop.type, lines: newStop.lines, takt_hvz: newStop.takt_hvz, source: "manual" };
    setTransitStops((prev) => [...prev, stop]);
    setShowAddDialog(false);
    setPendingClick(null);
    setNewStop({ name: "", type: "Bus", lines: "", takt_hvz: 10 });
    setAddStopMode(false);
  };

  const removeManualStop = (id: string) => setTransitStops((prev) => prev.filter((s) => s.id !== id));

  const saveStops = async () => {
    if (!site) return;
    setSaving(true);
    const { error } = await supabase.from("project_sites").update({ metadata: { ...(site.metadata || {}), transit_stops: transitStops } }).eq("id", site.id);
    setSaving(false);
    error ? toast.error("Fehler: " + error.message) : toast.success("Haltestellen gespeichert");
  };

  if (!site) return <div className="p-6 text-center text-muted-foreground text-sm">Kein Grundstück angelegt. Bitte zuerst ein Grundstück erstellen.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={oepnvStatus ? "default" : "destructive"} className="text-xs">
          {oepnvStatus ? "✅ ÖPNV-Nachweis erfüllt (StPlS §4)" : "❌ ÖPNV-Nachweis ausstehend"}
        </Badge>
        {overpassLoading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Haltestellen werden geladen…</span>}
        {!overpassLoading && autoStops.length > 0 && (
          <span className="text-[11px] text-muted-foreground">{autoStops.length} Haltestellen (OSM) · {nahversorgung.length} Einrichtungen geladen</span>
        )}
        {cacheSource && !overpassLoading && (
          <span className="text-[10px] text-muted-foreground italic">
            {cacheSource === "memory" ? "Cache (Session)" : cacheSource === "db" ? "Cache (gespeichert)" : "Frisch geladen"}
          </span>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={refreshOverpass} disabled={overpassLoading} title="Cache leeren und ÖPNV-Daten neu laden">
          <RefreshCw className={`h-3 w-3 mr-1 ${overpassLoading ? "animate-spin" : ""}`} /> ÖPNV neu laden
        </Button>
        <Button variant={addStopMode ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setAddStopMode(!addStopMode)}>
          <Plus className="h-3 w-3 mr-1" /> {addStopMode ? "Klick auf Karte…" : "Haltestelle manuell"}
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={saveStops} disabled={saving}>
          <Save className="h-3 w-3 mr-1" /> {saving ? "Speichert…" : "Speichern"}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground border border-border rounded-md bg-card px-3 py-1.5">
        <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: "#3b82f6" }} />Bus (300m)</span>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#d97706" }} />Tram (400m)</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: "#7c3aed" }} />U-Bahn (600m)</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: "#059669" }} />S-Bahn (600m)</span>
        <span><span className="inline-block w-2 h-2 rounded mr-1" style={{ background: "#22c55e" }} />Nahversorgung</span>
        <span className="text-muted-foreground/60">| Farbig = OSM · Manuell = mit Rand</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-md"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div ref={mapRef} id="leaflet-map" className="h-[500px] rounded-md border border-border" />
      )}

      {transitStops.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-3 py-1.5 font-medium">Name</th>
                <th className="text-left px-3 py-1.5 font-medium">Typ</th>
                <th className="text-left px-3 py-1.5 font-medium">Linien</th>
                <th className="text-left px-3 py-1.5 font-medium">Takt</th>
                <th className="text-left px-3 py-1.5 font-medium">Entf.</th>
                <th className="px-3 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {transitStops.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-1.5">{s.name}</td>
                  <td className="px-3 py-1.5"><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: STOP_COLORS[s.type] }} />{s.type}</td>
                  <td className="px-3 py-1.5">{s.lines || "–"}</td>
                  <td className="px-3 py-1.5">{s.takt_hvz} min</td>
                  <td className="px-3 py-1.5">{center ? `${Math.round(haversineDistance(center[0], center[1], s.lat, s.lng))} m` : "–"}</td>
                  <td className="px-3 py-1.5"><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeManualStop(s.id)}><Trash2 className="h-3 w-3" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {autoStops.length} Haltestellen automatisch geladen · {transitStops.length} manuell · {nahversorgung.length} Nahversorger · Radien: 300m (blau) / 400m (orange) / 600m (lila)
      </p>

      <p className="text-[11px] text-muted-foreground/70 italic">
        Haltestellen automatisch aus OpenStreetMap geladen. Entfernungen als Luftlinie nach StPlS München 2025 (§4). Bitte Angaben prüfen und fehlende Haltestellen manuell ergänzen.
      </p>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-sm">Haltestelle hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label><Input value={newStop.name} onChange={(e) => setNewStop((p) => ({ ...p, name: e.target.value }))} placeholder="z.B. Hauptbahnhof" className="h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">Typ</Label>
              <select value={newStop.type} onChange={(e) => setNewStop((p) => ({ ...p, type: e.target.value as TransitStop["type"] }))} className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="Bus">Bus</option>
                <option value="Tram">Tram</option>
                <option value="U-Bahn">U-Bahn</option>
                <option value="S-Bahn">S-Bahn</option>
              </select>
            </div>
            <div><Label className="text-xs">Linien</Label><Input value={newStop.lines} onChange={(e) => setNewStop((p) => ({ ...p, lines: e.target.value }))} placeholder="z.B. U3, U6" className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Takt HVZ (min)</Label><Input type="number" value={newStop.takt_hvz} onChange={(e) => setNewStop((p) => ({ ...p, takt_hvz: parseInt(e.target.value) || 10 }))} className="h-8 text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button size="sm" onClick={addManualStop}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
