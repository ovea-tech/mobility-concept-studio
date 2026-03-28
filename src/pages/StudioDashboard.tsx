import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  MapPin, Package, Scale, FileSearch, Plus, Rocket,
} from "lucide-react";
import { format } from "date-fns";

export default function StudioDashboard() {
  const navigate = useNavigate();

  const { data: muniData, isLoading: muniLoading } = useQuery({
    queryKey: ["studio-muni-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("municipalities").select("id");
      if (error) throw error;
      return data;
    },
  });
  const muniCount = muniData?.length ?? 0;

  const { data: activePackData, isLoading: packLoading } = useQuery({
    queryKey: ["studio-active-pack-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jurisdiction_packs").select("id").eq("status", "released");
      if (error) throw error;
      return data;
    },
  });
  const activePackCount = activePackData?.length ?? 0;

  const { data: candidateData, isLoading: candLoading } = useQuery({
    queryKey: ["studio-candidate-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rule_candidates").select("id").in("status", ["candidate", "draft"]);
      if (error) throw error;
      return data;
    },
  });
  const candidateCount = candidateData?.length ?? 0;

  const { data: ruleData, isLoading: ruleLoading } = useQuery({
    queryKey: ["studio-rule-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rules").select("id");
      if (error) throw error;
      return data;
    },
  });
  const ruleCount = ruleData?.length ?? 0;

  const { data: recentPacks, isLoading: packsListLoading } = useQuery({
    queryKey: ["studio-recent-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jurisdiction_packs")
        .select("id, name, status, created_at, municipalities(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentCandidates, isLoading: candListLoading } = useQuery({
    queryKey: ["studio-recent-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rule_candidates")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Pack Studio</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Regelpflege, Kommunen und Plattformsteuerung</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => navigate("/studio/municipalities")}>
              <MapPin className="h-3.5 w-3.5 mr-1" /> Kommunen
            </Button>
            <Button size="sm" className="h-8 text-[13px]" onClick={() => navigate("/studio/packs")}>
              <Package className="h-3.5 w-3.5 mr-1" /> Regelpakete
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Kommunen" value={muniCount ?? 0} loading={muniLoading} />
          <StatCard label="Aktive Packs" value={activePackCount ?? 0} loading={packLoading} />
          <StatCard label="Offene Kandidaten" value={candidateCount ?? 0} loading={candLoading} />
          <StatCard label="Regeln gesamt" value={ruleCount ?? 0} loading={ruleLoading} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent packs */}
          <div>
            <SectionHeader icon={Package} title="Letzte Regelpakete" />
            <div className="border border-border rounded-md bg-card overflow-hidden">
              {packsListLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !recentPacks?.length ? (
                <EmptySection text="Keine Regelpakete vorhanden." />
              ) : (
                <div className="divide-y divide-border">
                  {recentPacks.map((p) => {
                    const muniName = p.municipalities && !Array.isArray(p.municipalities) ? p.municipalities.name : "–";
                    return (
                      <div
                        key={p.id}
                        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => navigate(`/studio/packs/${p.id}`)}
                      >
                        <div>
                          <div className="text-[13px] font-medium">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">{muniName} · {format(new Date(p.created_at), "dd.MM.yyyy")}</div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent candidates */}
          <div>
            <SectionHeader icon={FileSearch} title="Neueste Regelkandidaten" />
            <div className="border border-border rounded-md bg-card overflow-hidden">
              {candListLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !recentCandidates?.length ? (
                <EmptySection text="Keine Regelkandidaten vorhanden." />
              ) : (
                <div className="divide-y divide-border">
                  {recentCandidates.map((c) => (
                    <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-medium">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground">{format(new Date(c.created_at), "dd.MM.yyyy")}</div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <SectionHeader icon={Rocket} title="Schnellaktionen" />
          <div className="flex gap-2 flex-wrap">
            <QuickAction label="Kommune anlegen" onClick={() => navigate("/studio/municipalities")} />
            <QuickAction label="Regelpaket anlegen" onClick={() => navigate("/studio/packs")} />
            <QuickAction label="Audit-Protokoll" onClick={() => navigate("/admin/audit")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="border border-border rounded-md bg-card px-4 py-3">
      {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-semibold text-foreground">{value}</div>}
      <div className="text-[12px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-[13px] rounded-md border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}

function EmptySection({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">{text}</div>;
}
