import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import { format } from "date-fns";

export default function AuditLog() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Audit Log" description="Systemweites Ereignisprotokoll" />
      <div className="p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : !data?.length ? (
          <EmptyState icon={ScrollText} title="Keine Audit-Einträge" description="Das Audit-Log ist leer." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zeitpunkt</TableHead>
                <TableHead>Aktion</TableHead>
                <TableHead>Entität</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(e.created_at), "dd.MM.yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{e.action}</TableCell>
                  <TableCell className="text-muted-foreground">{e.entity_type}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                    {e.entity_id || "–"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                    {e.user_id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
