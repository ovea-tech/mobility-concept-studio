import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Package, Search } from "lucide-react";
import { format } from "date-fns";

export default function PackList() {
  const [search, setSearch] = useState("");

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
      <PageHeader title="Jurisdiction Packs" description="Kommunenspezifische Regelpakete">
        <div className="mt-3 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pack suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </PageHeader>
      <div className="p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="Keine Packs gefunden" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kommune</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versionen</TableHead>
                <TableHead>Aktualisiert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const versions = Array.isArray(p.jurisdiction_pack_versions) ? p.jurisdiction_pack_versions : [];
                const muniName = p.municipalities && !Array.isArray(p.municipalities) ? p.municipalities.name : "–";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{muniName}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{versions.length}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(p.updated_at), "dd.MM.yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
