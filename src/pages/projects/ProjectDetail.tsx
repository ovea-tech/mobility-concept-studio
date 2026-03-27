import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  MapPin, LayoutList, Lightbulb, GitBranch, Target,
  FileText, Send, ClipboardList, Info,
} from "lucide-react";

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2.5 pt-2 text-sm";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();

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

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Lädt…</div>;
  if (!project) return <div className="p-6 text-sm">Projekt nicht gefunden.</div>;

  return (
    <div>
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Erstellt: {format(new Date(project.created_at), "dd.MM.yyyy")}</span>
          <span>Aktualisiert: {format(new Date(project.updated_at), "dd.MM.yyyy")}</span>
        </div>
      </div>

      <Tabs defaultValue="sites" className="w-full">
        <div className="border-b bg-card px-6">
          <TabsList className="bg-transparent h-auto p-0 space-x-1">
            <TabsTrigger value="sites" className={tabTriggerClass}>Standorte</TabsTrigger>
            <TabsTrigger value="uses" className={tabTriggerClass}>Nutzungen</TabsTrigger>
            <TabsTrigger value="concepts" className={tabTriggerClass}>Konzepte</TabsTrigger>
            <TabsTrigger value="scenarios" className={tabTriggerClass}>Szenarien</TabsTrigger>
            <TabsTrigger value="measures" className={tabTriggerClass}>Maßnahmen</TabsTrigger>
            <TabsTrigger value="justifications" className={tabTriggerClass}>Begründungen</TabsTrigger>
            <TabsTrigger value="documents" className={tabTriggerClass}>Dokumente</TabsTrigger>
            <TabsTrigger value="snapshots" className={tabTriggerClass}>Snapshots</TabsTrigger>
            <TabsTrigger value="monitoring" className={tabTriggerClass}>Monitoring</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sites" className="p-6 mt-0">
          <SitesTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="uses" className="p-6 mt-0">
          <UsesTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="concepts" className="p-6 mt-0">
          <ConceptsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="scenarios" className="p-6 mt-0">
          <ScenariosTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="measures" className="p-6 mt-0">
          <MeasuresTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="justifications" className="p-6 mt-0">
          <JustificationsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="documents" className="p-6 mt-0">
          <DocumentsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="snapshots" className="p-6 mt-0">
          <SnapshotsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="monitoring" className="p-6 mt-0">
          <MonitoringTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SitesTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-sites", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={MapPin} title="Keine Standorte" description="Diesem Projekt sind noch keine Standorte zugeordnet." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Adresse</TableHead>
          <TableHead>Fläche (m²)</TableHead>
          <TableHead>Flurstück</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((site) => (
          <TableRow key={site.id}>
            <TableCell className="font-medium">{site.name}</TableCell>
            <TableCell className="text-muted-foreground">{site.address || "–"}</TableCell>
            <TableCell className="text-muted-foreground">{site.area_sqm ?? "–"}</TableCell>
            <TableCell className="text-muted-foreground">{site.cadastral_ref || "–"}</TableCell>
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
      const { data, error } = await supabase
        .from("use_types")
        .select("*, baseline_requirements(*)")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={LayoutList} title="Keine Nutzungen" description="Noch keine Nutzungsarten definiert." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nutzungsart</TableHead>
          <TableHead>Kategorie</TableHead>
          <TableHead>BGF (m²)</TableHead>
          <TableHead>Einheiten</TableHead>
          <TableHead>Stellplatzbedarf</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((use) => {
          const br = Array.isArray(use.baseline_requirements) ? use.baseline_requirements[0] : null;
          return (
            <TableRow key={use.id}>
              <TableCell className="font-medium">{use.name}</TableCell>
              <TableCell className="text-muted-foreground">{use.category || "–"}</TableCell>
              <TableCell className="text-muted-foreground">{use.gross_floor_area_sqm ?? "–"}</TableCell>
              <TableCell className="text-muted-foreground">{use.unit_count ?? "–"}</TableCell>
              <TableCell className="text-muted-foreground">{br?.required_spaces ?? "–"}</TableCell>
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
      const { data, error } = await supabase
        .from("mobility_concepts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Lightbulb} title="Keine Konzepte" description="Noch keine Mobilitätskonzepte angelegt." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Beschreibung</TableHead>
          <TableHead>Erstellt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">{c.description || "–"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
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
      const { data, error } = await supabase
        .from("scenarios")
        .select("*")
        .eq("project_id", projectId)
        .order("is_baseline", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={GitBranch} title="Keine Szenarien" description="Noch keine Szenarien erstellt." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Reduktion (%)</TableHead>
          <TableHead>Beschreibung</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell>
              {s.is_baseline ? (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Baseline</span>
              ) : (
                <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-0.5 rounded">Variante</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">{s.total_reduction_pct ?? "–"}</TableCell>
            <TableCell className="text-muted-foreground max-w-sm truncate">{s.description || "–"}</TableCell>
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
      const { data, error } = await supabase
        .from("measures")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Target} title="Keine Maßnahmen" description="Noch keine Maßnahmen definiert." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Kategorie</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reduktion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.name}</TableCell>
            <TableCell className="text-muted-foreground">{m.category || "–"}</TableCell>
            <TableCell><StatusBadge status={m.status} /></TableCell>
            <TableCell className="text-muted-foreground">
              {m.reduction_value != null ? `${m.reduction_value} ${m.reduction_unit || ""}` : "–"}
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
      const { data, error } = await supabase
        .from("justifications")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={FileText} title="Keine Begründungen" description="Noch keine Begründungen erfasst." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titel</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Erstellt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((j) => (
          <TableRow key={j.id}>
            <TableCell className="font-medium">{j.title}</TableCell>
            <TableCell className="text-muted-foreground">{j.justification_type || "–"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{format(new Date(j.created_at), "dd.MM.yyyy")}</TableCell>
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
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={FileText} title="Keine Dokumente" description="Noch keine Dokumente hochgeladen." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Dateiname</TableHead>
          <TableHead>Erstellt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell className="text-muted-foreground">{d.document_type || "–"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{d.file_name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{format(new Date(d.created_at), "dd.MM.yyyy")}</TableCell>
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
      const { data, error } = await supabase
        .from("submission_snapshots")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Send} title="Keine Snapshots" description="Noch keine Einreichungs-Snapshots erstellt." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Eingereicht</TableHead>
          <TableHead>Erstellt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.version_label}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {s.submitted_at ? format(new Date(s.submitted_at), "dd.MM.yyyy HH:mm") : "–"}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {format(new Date(s.created_at), "dd.MM.yyyy")}
            </TableCell>
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
      const { data, error } = await supabase
        .from("monitoring_items")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Lädt…</p>;
  if (!data?.length) return <EmptyState icon={ClipboardList} title="Keine Monitoring-Einträge" description="Noch keine Monitoring-Items erfasst." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Fällig</TableHead>
          <TableHead>Abgeschlossen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.title}</TableCell>
            <TableCell><StatusBadge status={m.status} /></TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {m.due_date ? format(new Date(m.due_date), "dd.MM.yyyy") : "–"}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {m.completed_at ? format(new Date(m.completed_at), "dd.MM.yyyy") : "–"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
