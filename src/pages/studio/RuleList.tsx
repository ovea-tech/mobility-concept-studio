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
import { Scale, Search } from "lucide-react";

export default function RuleList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rules").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const filtered = data?.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <PageHeader title="Regeln" description="Alle definierten Stellplatzregeln">
        <div className="mt-2.5 flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Regel suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-[13px]" />
          </div>
        </div>
      </PageHeader>
      <div className="p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Lädt…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Scale} title="Keine Regeln gefunden" />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[12px]">Code</TableHead>
              <TableHead className="text-[12px]">Titel</TableHead>
              <TableHead className="text-[12px]">Kategorie</TableHead>
              <TableHead className="text-[12px]">Typ</TableHead>
              <TableHead className="text-[12px]">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-[12px]">{r.code}</TableCell>
                  <TableCell className="font-medium text-[13px]">{r.title}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{r.category || "–"}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{r.rule_type || "–"}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
