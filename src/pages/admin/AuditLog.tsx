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
      <PageHeader title="Protokoll" description="Systemweites Ereignisprotokoll" />
      <div className="p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Lädt…</p>
        ) : !data?.length ? (
          <EmptyState icon={ScrollText} title="Keine Einträge vorhanden" description="Das Protokoll ist leer." />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[12px]">Zeitpunkt</TableHead>
              <TableHead className="text-[12px]">Aktion</TableHead>
              <TableHead className="text-[12px]">Entität</TableHead>
              <TableHead className="text-[12px]">Entitäts-ID</TableHead>
              <TableHead className="text-[12px]">Nutzer-ID</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-[12px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(e.created_at), "dd.MM.yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-mono text-[12px]">{e.action}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{e.entity_type}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                    {e.entity_id || "–"}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
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
