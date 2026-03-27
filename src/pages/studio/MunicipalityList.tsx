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
      const { data, error } = await supabase
        .from("municipalities")
        .select("*")
        .order("name");
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
        <div className="mt-3 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kommune suchen…"
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
          <EmptyState icon={MapPin} title="Keine Kommunen gefunden" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bundesland</TableHead>
                <TableHead>Gemeindeschlüssel</TableHead>
                <TableHead>Einwohner</TableHead>
                <TableHead>Fläche (km²)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.state}</TableCell>
                  <TableCell className="text-muted-foreground">{m.municipal_code || "–"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.population?.toLocaleString("de-DE") ?? "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.area_km2 ?? "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
