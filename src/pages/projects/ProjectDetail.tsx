import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  MapPin, LayoutList, Lightbulb, GitBranch, Target,
  FileText, Send, ClipboardList, ChevronLeft, Plus, BookOpen, Info,
  Calendar, Building2, Package, ArrowRight,
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

/* ── shared styles ── */
const tabClass =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-[13px] font-normal data-[state=active]:font-medium text-muted-foreground data-[state=active]:text-foreground";
const thClass = "text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium";
const tdClass = "text-[13px]";
const tdMuted = "text-[12px] text-muted-foreground";

function TabToolbar({ label, count, children }: { label: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal rounded-[4px]">{count}</Badge>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN WORKSPACE
   ══════════════════════════════════════════════ */
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, workspaces(name, organizations(name)), jurisdiction_pack_versions(version_number, version_label, status, jurisdiction_packs(name, municipalities(name, state)))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== ":id",
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-[14px] font-medium text-foreground">Projekt nicht gefunden</p>
        <p className="text-[12px] text-muted-foreground">Das angeforderte Projekt existiert nicht oder Sie haben keinen Zugriff.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/projects")} className="mt-2 text-[13px]">
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Zur Projektliste
        </Button>
      </div>
    );
  }

  const workspace = project.workspaces as any;
  const orgName = workspace?.organizations?.name ?? "–";
  const jpv = project.jurisdiction_pack_versions as any;
  const packName = jpv?.jurisdiction_packs?.name ?? "–";
  const muniName = jpv?.jurisdiction_packs?.municipalities?.name;
  const muniState = jpv?.jurisdiction_packs?.municipalities?.state;
  const packVersionLabel = jpv?.version_label || `v${jpv?.version_number ?? "?"}`;

  return (
    <div className="h-full flex flex-col">
      {/* ── Project Header ── */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => navigate("/projects")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-[16px] font-semibold tracking-tight text-foreground">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-[12px] text-muted-foreground ml-8 max-w-2xl leading-relaxed">{project.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 ml-8">
              <MetaChip icon={Building2} label={orgName} />
              <MetaChip icon={Package} label={`${packName} ${packVersionLabel}`} />
              {muniName && <MetaChip icon={MapPin} label={`${muniName}${muniState ? `, ${muniState}` : ""}`} />}
              <MetaChip icon={Calendar} label={`Erstellt ${format(new Date(project.created_at), "dd.MM.yyyy")}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Workspace Tabs ── */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card px-6 overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-0 flex-nowrap">
            <TabsTrigger value="overview" className={tabClass}>Übersicht</TabsTrigger>
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

        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="p-6 mt-0"><OverviewTab projectId={project.id} /></TabsContent>
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
        </div>
      </Tabs>
    </div>
  );
}

function MetaChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-[4px]">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════ */
function OverviewTab({ projectId }: { projectId: string }) {
  const { data: sites } = useQuery({ queryKey: ["project-sites", projectId], queryFn: async () => { const { data } = await supabase.from("project_sites").select("id").eq("project_id", projectId); return data ?? []; } });
  const { data: concepts } = useQuery({ queryKey: ["project-concepts-count", projectId], queryFn: async () => { const { data } = await supabase.from("mobility_concepts").select("id").eq("project_id", projectId); return data ?? []; } });
  const { data: scenarios } = useQuery({ queryKey: ["project-scenarios-count", projectId], queryFn: async () => { const { data } = await supabase.from("scenarios").select("id").eq("project_id", projectId); return data ?? []; } });
  const { data: measures } = useQuery({ queryKey: ["project-measures-count", projectId], queryFn: async () => { const { data } = await supabase.from("measures").select("id, status").eq("project_id", projectId); return data ?? []; } });
  const { data: documents } = useQuery({ queryKey: ["project-documents-count", projectId], queryFn: async () => { const { data } = await supabase.from("project_documents").select("id").eq("project_id", projectId); return data ?? []; } });
  const { data: snapshots } = useQuery({ queryKey: ["project-snapshots-count", projectId], queryFn: async () => { const { data } = await supabase.from("submission_snapshots").select("id").eq("project_id", projectId); return data ?? []; } });
  const { data: monitoring } = useQuery({ queryKey: ["project-monitoring-count", projectId], queryFn: async () => { const { data } = await supabase.from("monitoring_items").select("id, status, due_date").eq("project_id", projectId); return data ?? []; } });

  const openMonitoring = monitoring?.filter(m => m.status === "pending" || m.status === "in_progress").length ?? 0;
  const overdue = monitoring?.filter(m => m.due_date && new Date(m.due_date) < new Date() && (m.status === "pending" || m.status === "in_progress")).length ?? 0;
  const activeMeasures = measures?.filter(m => m.status === "proposed" || m.status === "active").length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Counts grid */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Standorte" value={sites?.length ?? 0} icon={MapPin} />
        <StatCard label="Konzepte" value={concepts?.length ?? 0} icon={Lightbulb} />
        <StatCard label="Szenarien" value={scenarios?.length ?? 0} icon={GitBranch} />
        <StatCard label="Maßnahmen" value={activeMeasures} suffix={measures?.length ? `/ ${measures.length}` : undefined} icon={Target} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Dokumente" value={documents?.length ?? 0} icon={FileText} />
        <StatCard label="Einreichungen" value={snapshots?.length ?? 0} icon={Send} />
        <StatCard label="Monitoring" value={openMonitoring} suffix={monitoring?.length ? `/ ${monitoring.length}` : undefined} icon={ClipboardList} />
        <StatCard label="Überfällig" value={overdue} icon={Calendar} highlight={overdue > 0} />
      </div>

      {/* Workflow guide */}
      <div className="border border-border rounded-md bg-card">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] font-medium text-foreground">Arbeitsfluss</span>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
            <WorkflowStep label="Standorte" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Nutzungen" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Baseline" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Konzept" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Szenarien" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Maßnahmen" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Begründungen" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Einreichung" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <WorkflowStep label="Monitoring" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ label }: { label: string }) {
  return <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground">{label}</span>;
}

function StatCard({ label, value, suffix, icon: Icon, highlight }: { label: string; value: number; suffix?: string; icon: any; highlight?: boolean }) {
  return (
    <div className={`border rounded-md px-3.5 py-3 flex items-start justify-between ${highlight ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
      <div>
        <div className={`text-[20px] font-semibold tabular-nums ${highlight ? "text-destructive" : "text-foreground"}`}>
          {value}{suffix && <span className="text-[13px] font-normal text-muted-foreground ml-0.5">{suffix}</span>}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </div>
      <Icon className={`h-4 w-4 mt-0.5 ${highlight ? "text-destructive/40" : "text-muted-foreground/30"}`} strokeWidth={1.5} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   SITES TAB
   ══════════════════════════════════════════════ */
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
      <TabToolbar label="Standorte" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Standort hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={MapPin} title="Keine Standorte vorhanden" description="Definieren Sie den ersten Projektstandort." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Standort anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Adresse</TableHead>
          <TableHead className={thClass}>Fläche (m²)</TableHead>
          <TableHead className={thClass}>Flurstück</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((s) => (
            <TableRow key={s.id} className="group">
              <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
              <TableCell className={tdMuted}>{s.address || "–"}</TableCell>
              <TableCell className={`${tdMuted} tabular-nums`}>{s.area_sqm != null ? Number(s.area_sqm).toLocaleString("de-DE") : "–"}</TableCell>
              <TableCell className={`${tdMuted} font-mono text-[11px]`}>{s.cadastral_ref || "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(s.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateSiteDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   USES TAB
   ══════════════════════════════════════════════ */
function UsesTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-uses", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("use_types").select("*, project_sites(name), baseline_requirements(required_spaces, calculation_basis, rule_reference)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <LoadingSkeleton />;
  if (!data?.length) return <EmptyState icon={LayoutList} title="Keine Nutzungsarten definiert" description="Nutzungsarten und Stellplatzbedarf werden hier verwaltet." />;
  return (
    <>
      <TabToolbar label="Nutzungen & Baseline" count={data.length} />
      <Table><TableHeader><TableRow>
        <TableHead className={thClass}>Nutzungsart</TableHead>
        <TableHead className={thClass}>Standort</TableHead>
        <TableHead className={thClass}>Kategorie</TableHead>
        <TableHead className={thClass}>BGF (m²)</TableHead>
        <TableHead className={thClass}>Einheiten</TableHead>
        <TableHead className={thClass}>Stellplatzbedarf</TableHead>
        <TableHead className={thClass}>Berechnungsgrundlage</TableHead>
      </TableRow></TableHeader><TableBody>
        {data.map((u) => {
          const br = Array.isArray(u.baseline_requirements) ? u.baseline_requirements[0] : null;
          const siteName = (u.project_sites as any)?.name;
          return (
            <TableRow key={u.id}>
              <TableCell className={`font-medium ${tdClass}`}>{u.name}</TableCell>
              <TableCell className={tdMuted}>{siteName || "–"}</TableCell>
              <TableCell className={tdMuted}>{u.category || "–"}</TableCell>
              <TableCell className={`${tdMuted} tabular-nums`}>{u.gross_floor_area_sqm != null ? Number(u.gross_floor_area_sqm).toLocaleString("de-DE") : "–"}</TableCell>
              <TableCell className={`${tdMuted} tabular-nums`}>{u.unit_count ?? "–"}</TableCell>
              <TableCell className={`${tdMuted} tabular-nums font-medium`}>{br?.required_spaces != null ? Number(br.required_spaces).toLocaleString("de-DE") : "–"}</TableCell>
              <TableCell className={`${tdMuted} text-[11px]`}>{br?.rule_reference || br?.calculation_basis || "–"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody></Table>
    </>
  );
}

/* ══════════════════════════════════════════════
   CONCEPTS TAB
   ══════════════════════════════════════════════ */
function ConceptsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createVersionOpen, setCreateVersionOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mobility_concepts").select("*, concept_versions(id, version_number, status, created_at)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar label="Mobilitätskonzepte" count={data?.length}>
        {data && data.length > 0 && (
          <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateVersionOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Version
          </Button>
        )}
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Konzept
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={Lightbulb} title="Kein Mobilitätskonzept vorhanden" description="Erstellen Sie Ihr erstes Konzept, um Szenarien und Maßnahmen zu definieren." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Konzept erstellen</Button>
       } /> : (
        <div className="space-y-4">
          {data.map((c) => {
            const versions = Array.isArray(c.concept_versions) ? c.concept_versions.sort((a: any, b: any) => b.version_number - a.version_number) : [];
            return (
              <div key={c.id} className="border border-border rounded-md bg-card">
                <div className="px-4 py-3 border-b border-border flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{c.name}</div>
                    {c.description && <div className="text-[12px] text-muted-foreground mt-0.5 max-w-lg">{c.description}</div>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{format(new Date(c.created_at), "dd.MM.yyyy")}</div>
                </div>
                {versions.length > 0 ? (
                  <div className="divide-y divide-border">
                    {versions.map((v: any) => (
                      <div key={v.id} className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">v{v.version_number}</span>
                          <StatusBadge status={v.status} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(v.created_at), "dd.MM.yyyy")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-[12px] text-muted-foreground">Noch keine Versionen erstellt.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <CreateConceptDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
      <CreateConceptVersionDialog open={createVersionOpen} onOpenChange={setCreateVersionOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   SCENARIOS TAB
   ══════════════════════════════════════════════ */
function ScenariosTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("*, concept_versions(version_number, mobility_concepts(name)), measures(id)").eq("project_id", projectId).order("is_baseline", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar label="Szenarien" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Szenario hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={GitBranch} title="Keine Szenarien erstellt" description="Erstellen Sie zunächst ein Konzept mit einer Version, um Szenarien anzulegen." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Szenario anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Konzept / Version</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>Maßnahmen</TableHead>
          <TableHead className={thClass}>Reduktion (%)</TableHead>
          <TableHead className={thClass}>Beschreibung</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((s) => {
            const cv = s.concept_versions as any;
            const conceptName = cv?.mobility_concepts?.name ?? "–";
            const measureCount = Array.isArray(s.measures) ? s.measures.length : 0;
            return (
              <TableRow key={s.id}>
                <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
                <TableCell className={tdMuted}>
                  {conceptName} <span className="font-mono text-[11px]">v{cv?.version_number ?? "?"}</span>
                </TableCell>
                <TableCell>
                  <span className={`text-[11px] font-medium px-1.5 py-[1px] rounded-[3px] ${s.is_baseline ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    {s.is_baseline ? "Baseline" : "Variante"}
                  </span>
                </TableCell>
                <TableCell className={`${tdMuted} tabular-nums`}>{measureCount}</TableCell>
                <TableCell className={`${tdMuted} tabular-nums`}>{s.total_reduction_pct != null ? `${s.total_reduction_pct}%` : "–"}</TableCell>
                <TableCell className={`${tdMuted} max-w-xs truncate`}>{s.description || "–"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      )}
      <CreateScenarioDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   MEASURES TAB
   ══════════════════════════════════════════════ */
function MeasuresTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-measures", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("measures").select("*, scenarios(name, is_baseline)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar label="Maßnahmen" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Maßnahme hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={Target} title="Keine Maßnahmen definiert" description="Legen Sie ein Szenario an und definieren Sie dann Maßnahmen." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Maßnahme anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Szenario</TableHead>
          <TableHead className={thClass}>Kategorie</TableHead>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Reduktion</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((m) => (
            <TableRow key={m.id}>
              <TableCell className={`font-medium ${tdClass}`}>{m.name}</TableCell>
              <TableCell className={tdMuted}>{(m.scenarios as any)?.name ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{m.category || "–"}</TableCell>
              <TableCell><StatusBadge status={m.status} /></TableCell>
              <TableCell className={`${tdMuted} tabular-nums`}>
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

/* ══════════════════════════════════════════════
   ASSUMPTIONS TAB
   ══════════════════════════════════════════════ */
function AssumptionsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-assumptions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("assumptions").select("*, scenarios(name)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar label="Annahmen" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Annahme hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={Lightbulb} title="Keine Annahmen erfasst" description="Dokumentieren Sie die Annahmen Ihrer Szenarien." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Annahme anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Szenario</TableHead>
          <TableHead className={thClass}>Konfidenz</TableHead>
          <TableHead className={thClass}>Quelle</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((a) => (
            <TableRow key={a.id}>
              <TableCell className={`font-medium ${tdClass}`}>{a.title}</TableCell>
              <TableCell className={tdMuted}>{(a.scenarios as any)?.name ?? "–"}</TableCell>
              <TableCell>
                {a.confidence ? (
                  <StatusBadge status={a.confidence === "high" ? "approved" : a.confidence === "medium" ? "pending" : "draft"} className="text-[11px]" />
                ) : <span className={tdMuted}>–</span>}
              </TableCell>
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

/* ══════════════════════════════════════════════
   JUSTIFICATIONS TAB
   ══════════════════════════════════════════════ */
function JustificationsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-justifications", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("justifications").select("*, measures(name), assumptions(title)").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar label="Begründungen" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Begründung hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={BookOpen} title="Keine Begründungen erfasst" description="Verknüpfen Sie Maßnahmen mit fachlichen Begründungen." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Begründung anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>Maßnahme</TableHead>
          <TableHead className={thClass}>Annahme</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((j) => (
            <TableRow key={j.id}>
              <TableCell className={`font-medium ${tdClass}`}>{j.title}</TableCell>
              <TableCell className={tdMuted}>{j.justification_type || "–"}</TableCell>
              <TableCell className={tdMuted}>{(j.measures as any)?.name ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{(j.assumptions as any)?.title ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(j.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateJustificationDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   DOCUMENTS TAB
   ══════════════════════════════════════════════ */
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
      <TabToolbar label="Projektdokumente" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Dokument erfassen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={FileText} title="Keine Dokumente vorhanden" description="Erfassen Sie Projektdokumente und Nachweise." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Dokument anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Dokumenttyp</TableHead>
          <TableHead className={thClass}>Dateiname</TableHead>
          <TableHead className={thClass}>Dateityp</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((d) => (
            <TableRow key={d.id}>
              <TableCell className={`font-medium ${tdClass}`}>{d.name}</TableCell>
              <TableCell className={tdMuted}>{d.document_type || "–"}</TableCell>
              <TableCell className={`${tdMuted} font-mono text-[11px]`}>{d.file_name}</TableCell>
              <TableCell className={`${tdMuted} text-[11px]`}>{d.file_type || "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(d.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreateDocumentDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   SNAPSHOTS TAB
   ══════════════════════════════════════════════ */
function SnapshotsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-snapshots", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("submission_snapshots").select("*, concept_versions(version_number, status, mobility_concepts(name))").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <TabToolbar label="Einreichungen" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Einreichung erstellen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={Send} title="Keine Einreichungen vorhanden" description="Erstellen Sie einen Einreichungs-Snapshot, um den aktuellen Stand festzuhalten." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Einreichung erstellen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Version</TableHead>
          <TableHead className={thClass}>Konzept</TableHead>
          <TableHead className={thClass}>Eingereicht</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((s) => {
            const cv = s.concept_versions as any;
            const conceptLabel = cv ? `${cv.mobility_concepts?.name ?? "–"} v${cv.version_number}` : "–";
            return (
              <TableRow key={s.id}>
                <TableCell className={`font-medium ${tdClass}`}>{s.version_label}</TableCell>
                <TableCell className={tdMuted}>{conceptLabel}</TableCell>
                <TableCell className={tdMuted}>
                  {s.submitted_at ? format(new Date(s.submitted_at), "dd.MM.yyyy HH:mm") : <StatusBadge status="pending" />}
                </TableCell>
                <TableCell className={tdMuted}>{format(new Date(s.created_at), "dd.MM.yyyy")}</TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      )}
      <CreateSnapshotDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   MONITORING TAB
   ══════════════════════════════════════════════ */
function MonitoringTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("monitoring_items").select("*, measures(name)").eq("project_id", projectId).order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();

  return (
    <>
      <TabToolbar label="Monitoring" count={data?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Eintrag hinzufügen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !data?.length ? <EmptyState icon={ClipboardList} title="Keine Monitoring-Einträge" description="Erfassen Sie Monitoring-Pflichten und Fristen." action={
         <Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Eintrag anlegen</Button>
       } /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Maßnahme</TableHead>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Fällig</TableHead>
          <TableHead className={thClass}>Abgeschlossen</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((m) => {
            const isOverdue = m.due_date && new Date(m.due_date) < now && m.status !== "compliant" && m.status !== "waived";
            return (
              <TableRow key={m.id}>
                <TableCell className={`font-medium ${tdClass}`}>{m.title}</TableCell>
                <TableCell className={tdMuted}>{(m.measures as any)?.name ?? "–"}</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell className={isOverdue ? "text-[12px] text-destructive font-medium" : tdMuted}>
                  {m.due_date ? format(new Date(m.due_date), "dd.MM.yyyy") : "–"}
                  {isOverdue && <span className="ml-1 text-[10px]">überfällig</span>}
                </TableCell>
                <TableCell className={tdMuted}>{m.completed_at ? format(new Date(m.completed_at), "dd.MM.yyyy") : "–"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      )}
      <CreateMonitoringDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}
