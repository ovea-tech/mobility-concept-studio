import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { MapPin, Search } from "lucide-react";

export default function MunicipalityList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["municipalities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("municipalities").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = data?.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.state.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <PageHeader title="Kommunen" description="Registry aller verfügbaren Kommunen">
        <div className="mt-2.5 flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Kommune suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[13px]" />
          </div>
        </div>
      </PageHeader>
      <div className="p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Lädt…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MapPin} title="Keine Kommunen gefunden" />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[12px]">Name</TableHead>
              <TableHead className="text-[12px]">Bundesland</TableHead>
              <TableHead className="text-[12px]">Gemeindeschlüssel</TableHead>
              <TableHead className="text-[12px]">Einwohner</TableHead>
              <TableHead className="text-[12px]">Fläche (km²)</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-[13px]">{m.name}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{m.state}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground font-mono">{m.municipal_code || "–"}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{m.population?.toLocaleString("de-DE") ?? "–"}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{m.area_km2 ?? "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
