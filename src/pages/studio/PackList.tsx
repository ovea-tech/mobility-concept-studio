import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Package, Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { CreatePackDialog } from "@/components/dialogs/CreatePackDialog";

export default function PackList() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["jurisdiction-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jurisdiction_packs")
        .select("*, municipalities(name), jurisdiction_pack_versions(id, version_number, status, version_label)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = data?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <PageHeader
        title="Regelpakete"
        description="Kommunenspezifische Jurisdiction Packs"
        actions={
          <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Neues Regelpaket
          </Button>
        }
      >
        <div className="mt-2.5 flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Regelpaket suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[13px]" />
          </div>
        </div>
      </PageHeader>
      <div className="p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Lädt…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="Keine Regelpakete gefunden" />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[12px]">Name</TableHead>
              <TableHead className="text-[12px]">Kommune</TableHead>
              <TableHead className="text-[12px]">Status</TableHead>
              <TableHead className="text-[12px]">Versionen</TableHead>
              <TableHead className="text-[12px]">Aktualisiert</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const versions = Array.isArray(p.jurisdiction_pack_versions) ? p.jurisdiction_pack_versions : [];
                const muniName = p.municipalities && !Array.isArray(p.municipalities) ? p.municipalities.name : "–";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-[13px]">{p.name}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{muniName}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{versions.length}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{format(new Date(p.updated_at), "dd.MM.yyyy")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <CreatePackDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
