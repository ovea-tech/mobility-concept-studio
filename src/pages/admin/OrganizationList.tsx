import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Building2, Search } from "lucide-react";
import { format } from "date-fns";

export default function OrganizationList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = data?.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <PageHeader title="Organisationen" description="Verwaltung aller Organisationen">
        <div className="mt-2.5 flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Organisation suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[13px]" />
          </div>
        </div>
      </PageHeader>
      <div className="p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Lädt…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Keine Organisationen gefunden" />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[12px]">Name</TableHead>
              <TableHead className="text-[12px]">Slug</TableHead>
              <TableHead className="text-[12px]">Erstellt</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-[13px]">{o.name}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground font-mono">{o.slug}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{format(new Date(o.created_at), "dd.MM.yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
