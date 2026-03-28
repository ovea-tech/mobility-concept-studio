import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban, Plus, ClipboardList, AlertTriangle, Calculator,
} from "lucide-react";
import { format } from "date-fns";

export default function CustomerDashboard() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, created_at, updated_at, mobility_factor")
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: monitoringItems, isLoading: monLoading } = useQuery({
    queryKey: ["dashboard-monitoring"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitoring_items")
        .select("id, title, due_date, status, project_id, projects(name)")
        .in("status", ["pending", "in_progress", "non_compliant"])
        .order("due_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const allProjects = projects ?? [];
  const counts = {
    draft: allProjects.filter((p) => p.status === "draft").length,
    active: allProjects.filter((p) => p.status === "active").length,
    submitted: allProjects.filter((p) => p.status === "submitted").length,
    approved: allProjects.filter((p) => p.status === "approved").length,
  };

  /* Action card logic */
  const overdueItem = monitoringItems?.find(
    (m) => m.due_date && new Date(m.due_date) < new Date()
  );
  const activeMissingMf = allProjects.find(
    (p) => p.status === "active" && p.mobility_factor == null
  );

  function getNextStep(p: any) {
    if (p.status === "draft") return { label: "Planung starten", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    if (p.status === "active") {
      return p.mobility_factor == null
        ? { label: "MF noch nicht berechnet", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" }
        : { label: "Berechnung läuft", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
    }
    if (p.status === "submitted") return { label: "Formblatt bereit", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" };
    if (p.status === "approved") return { label: "Abgeschlossen ✓", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
    return null;
  }

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Arbeitsbereich</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Projektübersicht und offene Aufgaben</p>
          </div>
          <Link to="/projects/new">
            <Button size="sm" className="h-8 text-[13px]">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Neues Projekt
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Entwurf", count: counts.draft },
            { label: "In Bearbeitung", count: counts.active },
            { label: "Finalisiert", count: counts.submitted },
            { label: "Genehmigt", count: counts.approved },
          ].map((s) => (
            <div key={s.label} className="border border-border rounded-md bg-card px-4 py-3">
              {projectsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-semibold text-foreground">{s.count}</div>
              )}
              <div className="text-[12px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* FIX 2: Action card */}
        {overdueItem && (() => {
          const proj = overdueItem.projects as any;
          return (
            <div className="border-2 border-destructive/50 rounded-md bg-destructive/5 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-destructive">1 Monitoring-Nachweis überfällig</p>
                <p className="text-[12px] text-foreground mt-0.5">{overdueItem.title}</p>
                {proj?.name && <p className="text-[11px] text-muted-foreground">{proj.name}</p>}
              </div>
              <Link to={`/projects/${overdueItem.project_id}`}>
                <Button size="sm" variant="outline" className="h-7 text-[12px]">→ Jetzt erledigen</Button>
              </Link>
            </div>
          );
        })()}

        {!overdueItem && activeMissingMf && (
          <div className="border-2 border-amber-300 rounded-md bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 flex items-start gap-3">
            <Calculator className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">Mobilitätsfaktor noch nicht berechnet</p>
              <p className="text-[12px] text-foreground mt-0.5">{activeMissingMf.name}</p>
            </div>
            <Link to={`/projects/${activeMissingMf.id}`}>
              <Button size="sm" variant="outline" className="h-7 text-[12px]">→ Jetzt berechnen</Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Recent projects */}
          <div className="col-span-2">
            <SectionHeader icon={FolderKanban} title="Aktuelle Projekte" />
            <div className="border border-border rounded-md bg-card overflow-hidden">
              {projectsLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : !allProjects.length ? (
                <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  Keine Projekte vorhanden.
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Projekt</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Nächster Schritt</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Aktualisiert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProjects.slice(0, 5).map((p) => {
                      const next = getNextStep(p);
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium">
                            <Link to={`/projects/${p.id}`} className="text-primary hover:underline">
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                          <td className="px-4 py-2.5">
                            {next && (
                              <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${next.color}`}>
                                {next.label}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-[12px]">
                            {format(new Date(p.updated_at), "dd.MM.yyyy")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div>
              <SectionHeader icon={ClipboardList} title="Offene Nachweise" />
              <div className="border border-border rounded-md bg-card overflow-hidden">
                {monLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : !monitoringItems?.length ? (
                  <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                    Keine offenen Fristen.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {monitoringItems.map((m) => {
                      const proj = m.projects as any;
                      const isOverdue = m.due_date && new Date(m.due_date) < new Date();
                      return (
                        <div key={m.id} className="px-4 py-2.5">
                          <div className="text-[13px] font-medium">{m.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge status={isOverdue ? "overdue" : m.status} />
                            {proj?.name && (
                              <span className="text-[11px] text-muted-foreground">{proj.name}</span>
                            )}
                            {m.due_date && (
                              <span className="text-[11px] text-muted-foreground">
                                · Fällig {format(new Date(m.due_date), "dd.MM.yyyy")}
                              </span>
                            )}
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

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
    </div>
  );
}
