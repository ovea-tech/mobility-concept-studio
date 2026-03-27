import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban, Plus, ClipboardList, Send, FileText, Target,
} from "lucide-react";
import { format } from "date-fns";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: monitoringItems } = useQuery({
    queryKey: ["dashboard-monitoring"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitoring_items")
        .select("*, projects(name)")
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentMeasures } = useQuery({
    queryKey: ["dashboard-measures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measures")
        .select("*, projects(name)")
        .order("updated_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const allProjects = projects ?? [];
  const byStatus = {
    draft: allProjects.filter((p) => p.status === "draft"),
    active: allProjects.filter((p) => p.status === "active"),
    in_review: allProjects.filter((p) => p.status === "in_review"),
    submitted: allProjects.filter((p) => p.status === "submitted"),
    approved: allProjects.filter((p) => p.status === "approved"),
  };

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Arbeitsbereich</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Projektübersicht und offene Aufgaben</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-[13px]" onClick={() => navigate("/projects/new")}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Neues Projekt
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status summary */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Entwurf", count: byStatus.draft.length, status: "draft" },
            { label: "Aktiv", count: byStatus.active.length, status: "active" },
            { label: "In Prüfung", count: byStatus.in_review.length, status: "in_review" },
            { label: "Eingereicht", count: byStatus.submitted.length, status: "submitted" },
            { label: "Freigegeben", count: byStatus.approved.length, status: "approved" },
          ].map((s) => (
            <div key={s.status} className="border border-border rounded-md bg-card px-4 py-3">
              <div className="text-2xl font-semibold text-foreground">{s.count}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent projects */}
          <div className="col-span-2">
            <SectionHeader icon={FolderKanban} title="Zuletzt bearbeitete Projekte" />
            <div className="border border-border rounded-md bg-card overflow-hidden">
              {allProjects.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  Keine Projekte vorhanden.
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Projekt</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Aktualisiert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProjects.slice(0, 8).map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        <td className="px-4 py-2.5 font-medium">{p.name}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-2.5 text-muted-foreground text-[12px]">
                          {format(new Date(p.updated_at), "dd.MM.yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right column: monitoring + quick actions */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div>
              <SectionHeader icon={Target} title="Schnellaktionen" />
              <div className="space-y-1.5">
                <QuickAction label="Projekt anlegen" onClick={() => navigate("/projects/new")} />
                <QuickAction label="Alle Projekte" onClick={() => navigate("/projects")} />
              </div>
            </div>

            {/* Monitoring */}
            <div>
              <SectionHeader icon={ClipboardList} title="Offene Monitoring-Fristen" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {!monitoringItems?.length ? (
                  <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                    Keine offenen Fristen.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {monitoringItems.map((m) => (
                      <div key={m.id} className="px-4 py-2.5">
                        <div className="text-[13px] font-medium">{m.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={m.status} />
                          {m.due_date && (
                            <span className="text-[11px] text-muted-foreground">
                              Fällig {format(new Date(m.due_date), "dd.MM.yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent measures */}
            <div>
              <SectionHeader icon={Target} title="Letzte Maßnahmen" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {!recentMeasures?.length ? (
                  <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                    Keine Maßnahmen vorhanden.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentMeasures.slice(0, 5).map((m) => (
                      <div key={m.id} className="px-4 py-2.5">
                        <div className="text-[13px] font-medium">{m.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={m.status} />
                          <span className="text-[11px] text-muted-foreground">{m.category || ""}</span>
                        </div>
                      </div>
                    ))}
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
