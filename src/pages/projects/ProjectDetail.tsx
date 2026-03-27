import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  MapPin, LayoutList, Lightbulb, GitBranch, Target,
  FileText, Send, ClipboardList, ChevronLeft,
} from "lucide-react";

const tabClass =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-[13px] font-normal data-[state=active]:font-medium";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-[13px] text-muted-foreground">Lädt…</div>;
  if (!project) return <div className="p-6 text-[13px] text-muted-foreground">Projekt nicht gefunden.</div>;

  return (
    <div>
      {/* Project header */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={() => navigate("/projects")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-[15px] font-semibold leading-tight">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.description && (
          <p className="text-[12px] text-muted-foreground ml-8 max-w-2xl leading-snug">{project.description}</p>
        )}
        <div className="flex items-center gap-4 mt-1.5 ml-8 text-[11px] text-muted-foreground/70">
          <span>Erstellt {format(new Date(project.created_at), "dd.MM.yyyy")}</span>
          <span>·</span>
          <span>Aktualisiert {format(new Date(project.updated_at), "dd.MM.yyyy")}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sites" className="w-full">
        <div className="border-b border-border bg-card px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="sites" className={tabClass}>Standorte</TabsTrigger>
            <TabsTrigger value="uses" className={tabClass}>Nutzungen</TabsTrigger>
            <TabsTrigger value="concepts" className={tabClass}>Konzepte</TabsTrigger>
            <TabsTrigger value="scenarios" className={tabClass}>Szenarien</TabsTrigger>
            <TabsTrigger value="measures" className={tabClass}>Maßnahmen</TabsTrigger>
            <TabsTrigger value="justifications" className={tabClass}>Begründungen</TabsTrigger>
            <TabsTrigger value="documents" className={tabClass}>Dokumente</TabsTrigger>
            <TabsTrigger value="snapshots" className={tabClass}>Einreichungen</TabsTrigger>
            <TabsTrigger value="monitoring" className={tabClass}>Monitoring</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sites" className="p-6 mt-0"><SitesTab projectId={project.id} /></TabsContent>
        <TabsContent value="uses" className="p-6 mt-0"><UsesTab projectId={project.id} /></TabsContent>
        <TabsContent value="concepts" className="p-6 mt-0"><ConceptsTab projectId={project.id} /></TabsContent>
        <TabsContent value="scenarios" className="p-6 mt-0"><ScenariosTab projectId={project.id} /></TabsContent>
        <TabsContent value="measures" className="p-6 mt-0"><MeasuresTab projectId={project.id} /></TabsContent>
        <TabsContent value="justifications" className="p-6 mt-0"><JustificationsTab projectId={project.id} /></TabsContent>
        <TabsContent value="documents" className="p-6 mt-0"><DocumentsTab projectId={project.id} /></TabsContent>
        <TabsContent value="snapshots" className="p-6 mt-0"><SnapshotsTab projectId={project.id} /></TabsContent>
        <TabsContent value="monitoring" className="p-6 mt-0"><MonitoringTab projectId={project.id} /></TabsContent>
      </Tabs>
    </div>
  );
}

// --- Tab Components ---

const thClass = "text-[12px]";
const tdClass = "text-[13px]";
const tdMuted = "text-[12px] text-muted-foreground";

function SitesTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-sites", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_sites").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={MapPin} title="Keine Standorte vorhanden" description="Diesem Projekt sind noch keine Standorte zugeordnet." />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Name</TableHead>
        <TableHead className={thClass}>Adresse</TableHead>
        <TableHead className={thClass}>Fläche (m²)</TableHead>
        <TableHead className={thClass}>Flurstück</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((s) => (
          <TableRow key={s.id}>
            <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
            <TableCell className={tdMuted}>{s.address || "–"}</TableCell>
            <TableCell className={tdMuted}>{s.area_sqm ?? "–"}</TableCell>
            <TableCell className={tdMuted}>{s.cadastral_ref || "–"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UsesTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-uses", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("use_types").select("*, baseline_requirements(*)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={LayoutList} title="Keine Nutzungsarten definiert" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Nutzungsart</TableHead>
        <TableHead className={thClass}>Kategorie</TableHead>
        <TableHead className={thClass}>BGF (m²)</TableHead>
        <TableHead className={thClass}>Einheiten</TableHead>
        <TableHead className={thClass}>Stellplatzbedarf</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((u) => {
          const br = Array.isArray(u.baseline_requirements) ? u.baseline_requirements[0] : null;
          return (
            <TableRow key={u.id}>
              <TableCell className={`font-medium ${tdClass}`}>{u.name}</TableCell>
              <TableCell className={tdMuted}>{u.category || "–"}</TableCell>
              <TableCell className={tdMuted}>{u.gross_floor_area_sqm ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{u.unit_count ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{br?.required_spaces ?? "–"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ConceptsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mobility_concepts").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Lightbulb} title="Keine Konzepte angelegt" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Name</TableHead>
        <TableHead className={thClass}>Beschreibung</TableHead>
        <TableHead className={thClass}>Erstellt</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((c) => (
          <TableRow key={c.id}>
            <TableCell className={`font-medium ${tdClass}`}>{c.name}</TableCell>
            <TableCell className={`${tdMuted} max-w-md truncate`}>{c.description || "–"}</TableCell>
            <TableCell className={tdMuted}>{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ScenariosTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("*").eq("project_id", projectId).order("is_baseline", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={GitBranch} title="Keine Szenarien erstellt" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Name</TableHead>
        <TableHead className={thClass}>Typ</TableHead>
        <TableHead className={thClass}>Reduktion (%)</TableHead>
        <TableHead className={thClass}>Beschreibung</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((s) => (
          <TableRow key={s.id}>
            <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
            <TableCell>
              <span className={`text-[11px] font-medium px-1.5 py-[1px] rounded-[3px] ${s.is_baseline ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                {s.is_baseline ? "Baseline" : "Variante"}
              </span>
            </TableCell>
            <TableCell className={tdMuted}>{s.total_reduction_pct ?? "–"}</TableCell>
            <TableCell className={`${tdMuted} max-w-sm truncate`}>{s.description || "–"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MeasuresTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-measures", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("measures").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Target} title="Keine Maßnahmen definiert" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Name</TableHead>
        <TableHead className={thClass}>Kategorie</TableHead>
        <TableHead className={thClass}>Status</TableHead>
        <TableHead className={thClass}>Reduktion</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((m) => (
          <TableRow key={m.id}>
            <TableCell className={`font-medium ${tdClass}`}>{m.name}</TableCell>
            <TableCell className={tdMuted}>{m.category || "–"}</TableCell>
            <TableCell><StatusBadge status={m.status} /></TableCell>
            <TableCell className={tdMuted}>
              {m.reduction_value != null ? `${m.reduction_value} ${m.reduction_unit || ""}`.trim() : "–"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function JustificationsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-justifications", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("justifications").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={FileText} title="Keine Begründungen erfasst" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Titel</TableHead>
        <TableHead className={thClass}>Typ</TableHead>
        <TableHead className={thClass}>Erstellt</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((j) => (
          <TableRow key={j.id}>
            <TableCell className={`font-medium ${tdClass}`}>{j.title}</TableCell>
            <TableCell className={tdMuted}>{j.justification_type || "–"}</TableCell>
            <TableCell className={tdMuted}>{format(new Date(j.created_at), "dd.MM.yyyy")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DocumentsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={FileText} title="Keine Dokumente vorhanden" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Name</TableHead>
        <TableHead className={thClass}>Typ</TableHead>
        <TableHead className={thClass}>Dateiname</TableHead>
        <TableHead className={thClass}>Erstellt</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className={`font-medium ${tdClass}`}>{d.name}</TableCell>
            <TableCell className={tdMuted}>{d.document_type || "–"}</TableCell>
            <TableCell className={`${tdMuted} font-mono text-[11px]`}>{d.file_name}</TableCell>
            <TableCell className={tdMuted}>{format(new Date(d.created_at), "dd.MM.yyyy")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SnapshotsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-snapshots", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("submission_snapshots").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Send} title="Keine Einreichungen vorhanden" description="Es wurden noch keine Einreichungs-Snapshots erstellt." />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Version</TableHead>
        <TableHead className={thClass}>Eingereicht</TableHead>
        <TableHead className={thClass}>Erstellt</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((s) => (
          <TableRow key={s.id}>
            <TableCell className={`font-medium ${tdClass}`}>{s.version_label}</TableCell>
            <TableCell className={tdMuted}>
              {s.submitted_at ? format(new Date(s.submitted_at), "dd.MM.yyyy HH:mm") : "–"}
            </TableCell>
            <TableCell className={tdMuted}>{format(new Date(s.created_at), "dd.MM.yyyy")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MonitoringTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("monitoring_items").select("*").eq("project_id", projectId).order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={ClipboardList} title="Keine Monitoring-Einträge" />;

  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className={thClass}>Titel</TableHead>
        <TableHead className={thClass}>Status</TableHead>
        <TableHead className={thClass}>Fällig</TableHead>
        <TableHead className={thClass}>Abgeschlossen</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.map((m) => (
          <TableRow key={m.id}>
            <TableCell className={`font-medium ${tdClass}`}>{m.title}</TableCell>
            <TableCell><StatusBadge status={m.status} /></TableCell>
            <TableCell className={tdMuted}>{m.due_date ? format(new Date(m.due_date), "dd.MM.yyyy") : "–"}</TableCell>
            <TableCell className={tdMuted}>{m.completed_at ? format(new Date(m.completed_at), "dd.MM.yyyy") : "–"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
