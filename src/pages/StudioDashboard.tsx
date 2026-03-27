import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Package, Scale, CheckCircle, Rocket, ScrollText, Plus, FlaskConical,
} from "lucide-react";
import { format } from "date-fns";

export default function StudioDashboard() {
  const navigate = useNavigate();

  const { data: municipalities } = useQuery({
    queryKey: ["municipalities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("municipalities").select("id").limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: packs } = useQuery({
    queryKey: ["studio-packs-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jurisdiction_packs").select("id, status").limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["studio-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pack_reviews")
        .select("*, jurisdiction_pack_versions(version_label, pack_id, jurisdiction_packs(name))")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: releases } = useQuery({
    queryKey: ["studio-releases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pack_releases")
        .select("*, jurisdiction_pack_versions(version_label, jurisdiction_packs(name))")
        .order("released_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: failedTests } = useQuery({
    queryKey: ["studio-failed-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pack_test_runs")
        .select("*, pack_test_cases(name)")
        .eq("passed", false)
        .order("run_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: auditEvents } = useQuery({
    queryKey: ["studio-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const packList = packs ?? [];
  const packsByStatus = {
    draft: packList.filter((p) => p.status === "draft").length,
    in_review: packList.filter((p) => p.status === "in_review").length,
    released: packList.filter((p) => p.status === "released").length,
  };

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Pack Studio & Verwaltung</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Regelpflege, Reviews und Plattformsteuerung</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => navigate("/studio/municipalities/new")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Kommune
            </Button>
            <Button size="sm" className="h-8 text-[13px]" onClick={() => navigate("/studio/packs/new")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Regelpaket
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Kommunen" value={municipalities?.length ?? 0} />
          <StatCard label="Regelpakete" value={packList.length} />
          <StatCard label="Entwurf" value={packsByStatus.draft} />
          <StatCard label="In Prüfung" value={packsByStatus.in_review} />
          <StatCard label="Veröffentlicht" value={packsByStatus.released} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Open reviews */}
            <div>
              <SectionHeader icon={CheckCircle} title="Offene Pack-Reviews" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {!reviews?.length ? (
                  <EmptySection text="Keine offenen Reviews." />
                ) : (
                  <div className="divide-y divide-border">
                    {reviews.map((r) => {
                      const jpv = r.jurisdiction_pack_versions as any;
                      const packName = jpv?.jurisdiction_packs?.name ?? "–";
                      return (
                        <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-medium">{packName}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Version {jpv?.version_label ?? "–"} · Erstellt {format(new Date(r.created_at), "dd.MM.yyyy")}
                            </div>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Failed tests */}
            <div>
              <SectionHeader icon={FlaskConical} title="Fehlgeschlagene Tests" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {!failedTests?.length ? (
                  <EmptySection text="Keine fehlgeschlagenen Tests." />
                ) : (
                  <div className="divide-y divide-border">
                    {failedTests.map((t) => (
                      <div key={t.id} className="px-4 py-2.5">
                        <div className="text-[13px] font-medium">{(t.pack_test_cases as any)?.name ?? "–"}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-lg">
                          {t.error_message || "Fehlgeschlagen"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Audit */}
            <div>
              <SectionHeader icon={ScrollText} title="Letzte Audit-Events" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {!auditEvents?.length ? (
                  <EmptySection text="Keine Audit-Events." />
                ) : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Aktion</th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Entität</th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Zeitpunkt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEvents.map((e) => (
                        <tr key={e.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-2">{e.action}</td>
                          <td className="px-4 py-2 text-muted-foreground">{e.entity_type}</td>
                          <td className="px-4 py-2 text-muted-foreground text-[12px]">
                            {format(new Date(e.created_at), "dd.MM.yyyy HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div>
              <SectionHeader icon={Rocket} title="Schnellaktionen" />
              <div className="space-y-1.5">
                <QuickAction label="Kommune anlegen" onClick={() => navigate("/studio/municipalities/new")} />
                <QuickAction label="Regelpaket anlegen" onClick={() => navigate("/studio/packs/new")} />
                <QuickAction label="Alle Kommunen" onClick={() => navigate("/studio/municipalities")} />
                <QuickAction label="Alle Regelpakete" onClick={() => navigate("/studio/packs")} />
                <QuickAction label="Alle Regeln" onClick={() => navigate("/studio/rules")} />
                <QuickAction label="Audit-Protokoll" onClick={() => navigate("/admin/audit")} />
              </div>
            </div>

            <div>
              <SectionHeader icon={Rocket} title="Letzte Releases" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {!releases?.length ? (
                  <EmptySection text="Keine Releases." />
                ) : (
                  <div className="divide-y divide-border">
                    {releases.map((r) => {
                      const jpv = r.jurisdiction_pack_versions as any;
                      return (
                        <div key={r.id} className="px-4 py-2.5">
                          <div className="text-[13px] font-medium">{jpv?.jurisdiction_packs?.name ?? "–"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {jpv?.version_label ?? "–"} · {format(new Date(r.released_at), "dd.MM.yyyy")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-md bg-card px-4 py-3">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
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
      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left rounded-md border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}

function EmptySection({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">{text}</div>;
}
