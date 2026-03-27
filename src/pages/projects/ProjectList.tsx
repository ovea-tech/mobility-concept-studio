import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { FolderKanban, Search } from "lucide-react";
import { format } from "date-fns";

export default function ProjectList() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <PageHeader title="Projekte" description="Alle Mobilitätskonzept-Projekte">
        <div className="mt-2.5 flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Projekt suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-[13px]"
            />
          </div>
        </div>
      </PageHeader>
      <div className="p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Lädt…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Keine Projekte gefunden"
            description={
              search
                ? "Kein Projekt entspricht der Suche."
                : "Es wurden noch keine Projekte angelegt."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">Name</TableHead>
                <TableHead className="text-[12px]">Status</TableHead>
                <TableHead className="text-[12px]">Erstellt</TableHead>
                <TableHead className="text-[12px]">Aktualisiert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell className="font-medium text-[13px]">{project.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[12px]">
                    {format(new Date(project.created_at), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[12px]">
                    {format(new Date(project.updated_at), "dd.MM.yyyy")}
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
