import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  MapPin, LayoutList, Lightbulb, GitBranch, Target,
  FileText, Send, ClipboardList, ChevronLeft, Plus, BookOpen,
} from "lucide-react";
import { CreateSiteDialog } from "@/components/dialogs/CreateSiteDialog";
import { CreateMeasureDialog } from "@/components/dialogs/CreateMeasureDialog";
import { CreateAssumptionDialog } from "@/components/dialogs/CreateAssumptionDialog";
import { CreateJustificationDialog } from "@/components/dialogs/CreateJustificationDialog";
import { CreateConceptDialog } from "@/components/dialogs/CreateConceptDialog";
import { CreateConceptVersionDialog } from "@/components/dialogs/CreateConceptVersionDialog";
import { CreateScenarioDialog } from "@/components/dialogs/CreateScenarioDialog";
import { CreateMonitoringDialog } from "@/components/dialogs/CreateMonitoringDialog";
import { CreateDocumentDialog } from "@/components/dialogs/CreateDocumentDialog";
import { CreateSnapshotDialog } from "@/components/dialogs/CreateSnapshotDialog";

const tabClass =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-[13px] font-normal data-[state=active]:font-medium";

const thClass = "text-[12px]";
const tdClass = "text-[13px]";
const tdMuted = "text-[12px] text-muted-foreground";

function TabToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between mb-4">{children}</div>;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-[13px] text-muted-foreground">Lädt…</div>;
  if (!project) return <div className="p-6 text-[13px] text-muted-foreground">Projekt nicht gefunden.</div>;

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => navigate("/projects")}>
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

      <Tabs defaultValue="sites" className="w-full">
        <div className="border-b border-border bg-card px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="sites" className={tabClass}>Standorte</TabsTrigger>
            <TabsTrigger value="uses" className={tabClass}>Nutzungen</TabsTrigger>
            <TabsTrigger value="concepts" className={tabClass}>Konzepte</TabsTrigger>
            <TabsTrigger value="scenarios" className={tabClass}>Szenarien</TabsTrigger>
            <TabsTrigger value="measures" className={tabClass}>Maßnahmen</TabsTrigger>
            <TabsTrigger value="assumptions" className={tabClass}>Annahmen</TabsTrigger>
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
        <TabsContent value="assumptions" className="p-6 mt-0"><AssumptionsTab projectId={project.id} /></TabsContent>
        <TabsContent value="justifications" className="p-6 mt-0"><JustificationsTab projectId={project.id} /></TabsContent>
        <TabsContent value="documents" className="p-6 mt-0"><DocumentsTab projectId={project.id} /></TabsContent>
        <TabsContent value="snapshots" className="p-6 mt-0"><SnapshotsTab projectId={project.id} /></TabsContent>
        <TabsContent value="monitoring" className="p-6 mt-0"><MonitoringTab projectId={project.id} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────── SITES ───────── */
function SitesTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-sites", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_sites").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Standorte</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Standort hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={MapPin} title="Keine Standorte vorhanden" description="Fügen Sie den ersten Standort hinzu." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Adresse</TableHead>
          <TableHead className={thClass}>Fläche (m²)</TableHead>
          <TableHead className={thClass}>Flurstück</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((s) => (
            <TableRow key={s.id}>
              <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
              <TableCell className={tdMuted}>{s.address || "–"}</TableCell>
              <TableCell className={tdMuted}>{s.area_sqm ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{s.cadastral_ref || "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateSiteDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── USES ───────── */
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
    <Table><TableHeader><TableRow>
      <TableHead className={thClass}>Nutzungsart</TableHead>
      <TableHead className={thClass}>Kategorie</TableHead>
      <TableHead className={thClass}>BGF (m²)</TableHead>
      <TableHead className={thClass}>Einheiten</TableHead>
      <TableHead className={thClass}>Stellplatzbedarf</TableHead>
    </TableRow></TableHeader><TableBody>
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
    </TableBody></Table>
  );
}

/* ───────── CONCEPTS ───────── */
function ConceptsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createVersionOpen, setCreateVersionOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mobility_concepts").select("*, concept_versions(id, version_number, status)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Konzepte</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateVersionOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Version
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Konzept
          </Button>
        </div>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={Lightbulb} title="Keine Konzepte angelegt" description="Erstellen Sie ein Mobilitätskonzept." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Beschreibung</TableHead>
          <TableHead className={thClass}>Versionen</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((c) => {
            const versions = Array.isArray(c.concept_versions) ? c.concept_versions : [];
            return (
              <TableRow key={c.id}>
                <TableCell className={`font-medium ${tdClass}`}>{c.name}</TableCell>
                <TableCell className={`${tdMuted} max-w-md truncate`}>{c.description || "–"}</TableCell>
                <TableCell className={tdMuted}>
                  {versions.length > 0 ? versions.map((v) => (
                    <span key={v.id} className="inline-flex items-center mr-1.5">
                      <span className="text-[11px] font-mono bg-muted px-1.5 py-[1px] rounded">v{v.version_number}</span>
                      <StatusBadge status={v.status} className="ml-1" />
                    </span>
                  )) : "–"}
                </TableCell>
                <TableCell className={tdMuted}>{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      )}
      <CreateConceptDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
      <CreateConceptVersionDialog open={createVersionOpen} onOpenChange={setCreateVersionOpen} projectId={projectId} />
    </>
  );
}

/* ───────── SCENARIOS ───────── */
function ScenariosTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("*").eq("project_id", projectId).order("is_baseline", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Szenarien</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Szenario hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={GitBranch} title="Keine Szenarien erstellt" description="Legen Sie ein Szenario an." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>Reduktion (%)</TableHead>
          <TableHead className={thClass}>Beschreibung</TableHead>
        </TableRow></TableHeader><TableBody>
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
        </TableBody></Table>
      )}
      <CreateScenarioDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── MEASURES ───────── */
function MeasuresTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-measures", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("measures").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Maßnahmen</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Maßnahme hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={Target} title="Keine Maßnahmen definiert" description="Definieren Sie Mobilitätsmaßnahmen." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Kategorie</TableHead>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Reduktion</TableHead>
        </TableRow></TableHeader><TableBody>
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
        </TableBody></Table>
      )}
      <CreateMeasureDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── ASSUMPTIONS ───────── */
function AssumptionsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-assumptions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("assumptions").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Annahmen</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Annahme hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={Lightbulb} title="Keine Annahmen erfasst" /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Konfidenz</TableHead>
          <TableHead className={thClass}>Quelle</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((a) => (
            <TableRow key={a.id}>
              <TableCell className={`font-medium ${tdClass}`}>{a.title}</TableCell>
              <TableCell className={tdMuted}>{a.confidence || "–"}</TableCell>
              <TableCell className={tdMuted}>{a.source || "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(a.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateAssumptionDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── JUSTIFICATIONS ───────── */
function JustificationsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-justifications", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("justifications").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Begründungen</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Begründung hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={BookOpen} title="Keine Begründungen erfasst" /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((j) => (
            <TableRow key={j.id}>
              <TableCell className={`font-medium ${tdClass}`}>{j.title}</TableCell>
              <TableCell className={tdMuted}>{j.justification_type || "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(j.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateJustificationDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── DOCUMENTS ───────── */
function DocumentsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Dokumente</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Dokument erfassen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={FileText} title="Keine Dokumente vorhanden" description="Erfassen Sie Projektdokumente." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>Dateiname</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((d) => (
            <TableRow key={d.id}>
              <TableCell className={`font-medium ${tdClass}`}>{d.name}</TableCell>
              <TableCell className={tdMuted}>{d.document_type || "–"}</TableCell>
              <TableCell className={`${tdMuted} font-mono text-[11px]`}>{d.file_name}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(d.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateDocumentDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── SNAPSHOTS ───────── */
function SnapshotsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-snapshots", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("submission_snapshots").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Einreichungen</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Einreichung erstellen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={Send} title="Keine Einreichungen vorhanden" description="Erstellen Sie einen Einreichungs-Snapshot." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Version</TableHead>
          <TableHead className={thClass}>Eingereicht</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((s) => (
            <TableRow key={s.id}>
              <TableCell className={`font-medium ${tdClass}`}>{s.version_label}</TableCell>
              <TableCell className={tdMuted}>
                {s.submitted_at ? format(new Date(s.submitted_at), "dd.MM.yyyy HH:mm") : "–"}
              </TableCell>
              <TableCell className={tdMuted}>{format(new Date(s.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateSnapshotDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ───────── MONITORING ───────── */
function MonitoringTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("monitoring_items").select("*").eq("project_id", projectId).order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Monitoring-Einträge</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Eintrag hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={ClipboardList} title="Keine Monitoring-Einträge" description="Erfassen Sie Monitoring-Pflichten." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Fällig</TableHead>
          <TableHead className={thClass}>Abgeschlossen</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((m) => (
            <TableRow key={m.id}>
              <TableCell className={`font-medium ${tdClass}`}>{m.title}</TableCell>
              <TableCell><StatusBadge status={m.status} /></TableCell>
              <TableCell className={tdMuted}>{m.due_date ? format(new Date(m.due_date), "dd.MM.yyyy") : "–"}</TableCell>
              <TableCell className={tdMuted}>{m.completed_at ? format(new Date(m.completed_at), "dd.MM.yyyy") : "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateMonitoringDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}
