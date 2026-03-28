import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MapPin, Lightbulb, ChevronLeft, ChevronDown, ChevronRight,
  Plus, ClipboardList, FileText, Calendar, Building2, Package,
  AlertCircle, Beaker, Target,
} from "lucide-react";

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
        </div>
      ))}
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
        .select(`
          *,
          workspaces(name, organizations(name)),
          jurisdiction_pack_versions(
            version_number, version_label, status,
            jurisdiction_packs(name, municipalities(name, state))
          )
        `)
        .eq("id", id!)
        .maybeSingle();
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
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
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
      {/* Header */}
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card px-6 overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-0 flex-nowrap">
            <TabsTrigger value="overview" className={tabClass}>Übersicht</TabsTrigger>
            <TabsTrigger value="concepts" className={tabClass}>Konzepte</TabsTrigger>
            <TabsTrigger value="scenarios" className={tabClass}>Szenarien & Maßnahmen</TabsTrigger>
            <TabsTrigger value="monitoring" className={tabClass}>Monitoring</TabsTrigger>
            <TabsTrigger value="documents" className={tabClass}>Dokumente</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="p-6 mt-0"><OverviewTab projectId={project.id} /></TabsContent>
          <TabsContent value="concepts" className="p-6 mt-0"><ConceptsTab projectId={project.id} /></TabsContent>
          <TabsContent value="scenarios" className="p-6 mt-0"><ScenariosTab projectId={project.id} /></TabsContent>
          <TabsContent value="monitoring" className="p-6 mt-0"><MonitoringTab projectId={project.id} /></TabsContent>
          <TabsContent value="documents" className="p-6 mt-0"><DocumentsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════ */
function OverviewTab({ projectId }: { projectId: string }) {
  const [createSiteOpen, setCreateSiteOpen] = useState(false);

  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ["project-sites", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_sites").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: concepts, isLoading: conceptsLoading } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mobility_concepts").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <TabToolbar label="Standorte" count={sites?.length}>
          <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateSiteOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Standort hinzufügen
          </Button>
        </TabToolbar>
        {sitesLoading ? <LoadingSkeleton rows={2} /> :
         !sites?.length ? (
          <EmptyState icon={MapPin} title="Keine Standorte vorhanden" description="Definieren Sie den ersten Projektstandort."
            action={<Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateSiteOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Standort anlegen</Button>}
          />
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className={thClass}>Name</TableHead>
              <TableHead className={thClass}>Adresse</TableHead>
              <TableHead className={thClass}>Fläche (m²)</TableHead>
              <TableHead className={thClass}>Erstellt</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
                  <TableCell className={tdMuted}>{s.address || "–"}</TableCell>
                  <TableCell className={`${tdMuted} tabular-nums`}>{s.area_sqm != null ? Number(s.area_sqm).toLocaleString("de-DE") : "–"}</TableCell>
                  <TableCell className={tdMuted}>{format(new Date(s.created_at), "dd.MM.yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <TabToolbar label="Konzepte" count={concepts?.length} />
        {conceptsLoading ? <LoadingSkeleton rows={2} /> :
         !concepts?.length ? (
          <p className="text-[13px] text-muted-foreground">Noch keine Konzepte angelegt. Wechseln Sie zum Tab „Konzepte".</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className={thClass}>Name</TableHead>
              <TableHead className={thClass}>Beschreibung</TableHead>
              <TableHead className={thClass}>Erstellt</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {concepts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className={`font-medium ${tdClass}`}>{c.name}</TableCell>
                  <TableCell className={`${tdMuted} max-w-xs truncate`}>{c.description || "–"}</TableCell>
                  <TableCell className={tdMuted}>{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateSiteDialog open={createSiteOpen} onOpenChange={setCreateSiteOpen} projectId={projectId} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONCEPTS TAB
   ══════════════════════════════════════════════ */
function ConceptsTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: concepts, isLoading } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mobility_concepts").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <TabToolbar label="Mobilitätskonzepte" count={concepts?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Konzept anlegen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !concepts?.length ? (
        <EmptyState icon={Lightbulb} title="Kein Mobilitätskonzept vorhanden" description="Erstellen Sie Ihr erstes Konzept, um Szenarien und Maßnahmen zu definieren."
          action={<Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Konzept erstellen</Button>}
        />
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead className={thClass}>Name</TableHead>
            <TableHead className={thClass}>Beschreibung</TableHead>
            <TableHead className={thClass}>Erstellt</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {concepts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className={`font-medium ${tdClass}`}>{c.name}</TableCell>
                <TableCell className={`${tdMuted} max-w-md truncate`}>{c.description || "–"}</TableCell>
                <TableCell className={tdMuted}>{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CreateConceptDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   SCENARIOS & MEASURES TAB
   ══════════════════════════════════════════════ */
function ScenariosTab({ projectId }: { projectId: string }) {
  const [createScenarioOpen, setCreateScenarioOpen] = useState(false);

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenarios")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <TabToolbar label="Szenarien" count={scenarios?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateScenarioOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Szenario anlegen
        </Button>
      </TabToolbar>

      {isLoading ? <LoadingSkeleton /> :
       !scenarios?.length ? (
        <EmptyState icon={Beaker} title="Keine Szenarien vorhanden"
          description="Erstellen Sie ein Szenario, um Maßnahmen zu definieren."
          action={<Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateScenarioOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Szenario erstellen</Button>}
        />
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} projectId={projectId} />
          ))}
        </div>
      )}

      <CreateScenarioDialog
        open={createScenarioOpen}
        onOpenChange={setCreateScenarioOpen}
        projectId={projectId}
      />
    </>
  );
}

function ScenarioCard({ scenario, projectId }: { scenario: any; projectId: string }) {
  const [open, setOpen] = useState(false);
  const [createMeasureOpen, setCreateMeasureOpen] = useState(false);

  const { data: measures, isLoading } = useQuery({
    queryKey: ["scenario-measures", scenario.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measures")
        .select("*")
        .eq("scenario_id", scenario.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-border rounded-md bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">{scenario.name}</span>
                  {scenario.is_baseline && <Badge variant="secondary" className="text-[10px] h-4 px-1">Basis</Badge>}
                </div>
                {scenario.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-lg truncate">{scenario.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {scenario.total_reduction_pct != null && (
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  Reduktion: {scenario.total_reduction_pct}%
                </span>
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Maßnahmen</span>
              <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => setCreateMeasureOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Maßnahme
              </Button>
            </div>
            {isLoading ? <LoadingSkeleton rows={2} /> :
             !measures?.length ? (
              <p className="text-[12px] text-muted-foreground py-2">Keine Maßnahmen definiert.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className={thClass}>Name</TableHead>
                  <TableHead className={thClass}>Kategorie</TableHead>
                  <TableHead className={thClass}>Reduktion</TableHead>
                  <TableHead className={thClass}>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {measures.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className={`font-medium ${tdClass}`}>{m.name}</TableCell>
                      <TableCell className={tdMuted}>{m.category || "–"}</TableCell>
                      <TableCell className={`${tdMuted} tabular-nums`}>
                        {m.reduction_value != null ? `${m.reduction_value} ${m.reduction_unit || ""}`.trim() : "–"}
                      </TableCell>
                      <TableCell><StatusBadge status={m.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <CreateMeasureDialog
            open={createMeasureOpen}
            onOpenChange={setCreateMeasureOpen}
            scenarioId={scenario.id}
            projectId={projectId}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ══════════════════════════════════════════════
   MONITORING TAB
   ══════════════════════════════════════════════ */
function MonitoringTab({ projectId }: { projectId: string }) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: items, isLoading } = useQuery({
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

  return (
    <>
      <TabToolbar label="Monitoring" count={items?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Eintrag anlegen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !items?.length ? (
        <EmptyState icon={ClipboardList} title="Keine Monitoring-Einträge"
          description="Legen Sie Monitoring-Einträge an, um Fristen und Nachweise zu verfolgen."
          action={<Button size="sm" variant="outline" className="text-[13px]" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Eintrag anlegen</Button>}
        />
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead className={thClass}>Titel</TableHead>
            <TableHead className={thClass}>Status</TableHead>
            <TableHead className={thClass}>Fällig am</TableHead>
            <TableHead className={thClass}>Abgeschlossen</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((m) => {
              const isOverdue = m.due_date && new Date(m.due_date) < new Date() && m.status === "pending";
              return (
                <TableRow key={m.id}>
                  <TableCell className={`font-medium ${tdClass}`}>{m.title}</TableCell>
                  <TableCell><StatusBadge status={isOverdue ? "overdue" : m.status} /></TableCell>
                  <TableCell className={`${tdMuted} tabular-nums`}>{m.due_date ? format(new Date(m.due_date), "dd.MM.yyyy") : "–"}</TableCell>
                  <TableCell className={tdMuted}>{m.completed_at ? format(new Date(m.completed_at), "dd.MM.yyyy") : "–"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <CreateMonitoringDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}

/* ══════════════════════════════════════════════
   DOCUMENTS TAB
   ══════════════════════════════════════════════ */
function DocumentsTab() {
  return (
    <EmptyState icon={FileText} title="Dokumente"
      description="Dokumenten-Upload und -Verwaltung folgt in einem späteren Sprint." />
  );
}

/* ══════════════════════════════════════════════
   CREATE SITE DIALOG
   ══════════════════════════════════════════════ */
function CreateSiteDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [areaSqm, setAreaSqm] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_sites").insert({
        project_id: projectId, name: name.trim(),
        address: address.trim() || null, area_sqm: areaSqm ? parseFloat(areaSqm) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-sites", projectId] });
      toast.success("Standort erstellt");
      onOpenChange(false);
      setName(""); setAddress(""); setAreaSqm("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Neuen Standort anlegen</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Baufeld A" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Musterstraße 1, 80331 München" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Fläche (m²)</Label>
            <Input value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} type="number" placeholder="5000" className="h-9 text-[13px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Standort erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   CREATE CONCEPT DIALOG
   ══════════════════════════════════════════════ */
function CreateConceptDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase.from("mobility_concepts").insert({
        project_id: projectId, name: name.trim(),
        description: description.trim() || null,
        created_by: session.session?.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-concepts", projectId] });
      toast.success("Konzept wurde angelegt");
      onOpenChange(false);
      setName(""); setDescription("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Neues Konzept anlegen</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Mobilitätskonzept Variante A" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Konzept erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   CREATE SCENARIO DIALOG
   ══════════════════════════════════════════════ */
function CreateScenarioDialog({ open, onOpenChange, projectId }: {
  open: boolean; onOpenChange: (v: boolean) => void; projectId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isBaseline, setIsBaseline] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scenarios").insert({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        is_baseline: isBaseline,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
      toast.success("Szenario wurde angelegt");
      onOpenChange(false);
      setName(""); setDescription(""); setIsBaseline(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Neues Szenario anlegen</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Szenario Basis" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is-baseline" checked={isBaseline} onCheckedChange={(v) => setIsBaseline(v === true)} />
            <Label htmlFor="is-baseline" className="text-[13px]">Als Baseline markieren</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Szenario erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   CREATE MEASURE DIALOG
   ══════════════════════════════════════════════ */
function CreateMeasureDialog({ open, onOpenChange, scenarioId, projectId }: {
  open: boolean; onOpenChange: (v: boolean) => void; scenarioId: string; projectId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [reductionValue, setReductionValue] = useState("");
  const [reductionUnit, setReductionUnit] = useState("Stellplätze");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("measures").insert({
        scenario_id: scenarioId,
        project_id: projectId,
        name: name.trim(),
        category: category.trim() || null,
        description: description.trim() || null,
        reduction_value: reductionValue ? parseFloat(reductionValue) : null,
        reduction_unit: reductionUnit || null,
        status: "proposed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenario-measures", scenarioId] });
      toast.success("Maßnahme wurde angelegt");
      onOpenChange(false);
      setName(""); setCategory(""); setDescription(""); setReductionValue(""); setReductionUnit("Stellplätze");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Neue Maßnahme anlegen</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Carsharing-Station" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Kategorie *</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z. B. Sharing, ÖPNV, Rad" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Reduktionswert</Label>
              <Input value={reductionValue} onChange={(e) => setReductionValue(e.target.value)} type="number" placeholder="z. B. 10" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Einheit</Label>
              <Input value={reductionUnit} onChange={(e) => setReductionUnit(e.target.value)} placeholder="Stellplätze" className="h-9 text-[13px]" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || !category.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Maßnahme erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   CREATE MONITORING DIALOG (inline)
   ══════════════════════════════════════════════ */
function CreateMonitoringDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("monitoring_items").insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-monitoring", projectId] });
      toast.success("Monitoring-Eintrag erstellt");
      onOpenChange(false);
      setTitle(""); setDescription(""); setDueDate("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Neuen Monitoring-Eintrag anlegen</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Carsharing-Nachweis Q3" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Fälligkeitsdatum</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Eintrag erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
