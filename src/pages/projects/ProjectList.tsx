import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { FolderKanban, Search, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { CreateProjectDialog } from "@/components/dialogs/CreateProjectDialog";

const thClass = "text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium";

export default function ProjectList() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { data: projects, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          workspaces(name, organizations(name)),
          jurisdiction_pack_versions(
            version_label,
            version_number,
            jurisdiction_packs(name, municipalities(name))
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <PageHeader
        title="Projekte"
        description="Alle Mobilitätskonzept-Projekte"
        actions={
          <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Neues Projekt
          </Button>
        }
      >
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
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/8" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-destructive text-[13px] py-8">
            <AlertCircle className="h-4 w-4" />
            <span>Fehler beim Laden: {(error as Error)?.message ?? "Unbekannt"}</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Keine Projekte gefunden"
            description={
              search
                ? "Kein Projekt entspricht der Suche."
                : "Noch keine Projekte vorhanden. Legen Sie Ihr erstes Projekt an."
            }
            action={
              !search ? (
                <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Projekt anlegen
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={thClass}>Name</TableHead>
                <TableHead className={thClass}>Kommune</TableHead>
                <TableHead className={thClass}>Regelpaket</TableHead>
                <TableHead className={thClass}>Status</TableHead>
                <TableHead className={thClass}>Erstellt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => {
                const jpv = project.jurisdiction_pack_versions as any;
                const packName = jpv?.jurisdiction_packs?.name ?? "–";
                const muniName = jpv?.jurisdiction_packs?.municipalities?.name ?? "–";
                return (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium text-[13px]">{project.name}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{muniName}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{packName}</TableCell>
                    <TableCell><StatusBadge status={project.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-[12px] tabular-nums">
                      {format(new Date(project.created_at), "dd.MM.yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
