import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Briefcase, Shield, ScrollText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: orgs } = useQuery({
    queryKey: ["admin-orgs-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id").limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: workspaces } = useQuery({
    queryKey: ["admin-workspaces-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workspaces").select("id").limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: auditEvents } = useQuery({
    queryKey: ["admin-audit-recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Plattformverwaltung</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Organisationen, Arbeitsbereiche, Rollen und Audit</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Organisationen" value={orgs?.length ?? 0} />
          <StatCard label="Arbeitsbereiche" value={workspaces?.length ?? 0} />
          <StatCard label="Audit-Events" value={auditEvents?.length ?? 0} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Letzte Audit-Events</h2>
            </div>
            <div className="border border-border rounded-md bg-card overflow-hidden">
              {!auditEvents?.length ? (
                <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">Keine Events.</div>
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
                        <td className="px-4 py-2 text-muted-foreground text-[12px]">{format(new Date(e.created_at), "dd.MM.yyyy HH:mm")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Schnellaktionen</h2>
            </div>
            <div className="space-y-1.5">
              <QuickAction label="Organisationen verwalten" onClick={() => navigate("/admin/organizations")} />
              <QuickAction label="Arbeitsbereiche verwalten" onClick={() => navigate("/admin/workspaces")} />
              <QuickAction label="Audit-Protokoll" onClick={() => navigate("/admin/audit")} />
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

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left rounded-md border border-border bg-card hover:bg-muted/50 transition-colors">
      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}
