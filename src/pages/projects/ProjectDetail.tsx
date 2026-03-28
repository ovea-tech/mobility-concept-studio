import React, { useState, useMemo } from "react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MapPin, Lightbulb, ChevronLeft, ChevronDown, ChevronRight,
  Plus, ClipboardList, FileText, Calendar, Building2, Package,
  AlertCircle, Beaker, Target, Pencil, Trash2, Scale, BookOpen,
  BarChart3, Upload, Paperclip, Download, Calculator, Home,
  Bell, GitBranch, ArrowRight, CheckCircle2,
} from "lucide-react";
import { CalculatorTab } from "@/components/project/CalculatorTab";
import { ComplianceTab } from "@/components/project/ComplianceTab";
import { FormblattViewer } from "@/components/project/FormblattViewer";
import { WorkflowStepper, WORKFLOW_STEPS, type WorkflowStep } from "@/components/project/WorkflowStepper";

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

function ActionIcon({ icon: Icon, onClick, title, variant = "default" }: { icon: any; onClick: () => void; title: string; variant?: "default" | "destructive" }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} title={title}
      className={`h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted transition-colors ${variant === "destructive" ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ── Status workflow helpers ── */
const STATUS_TRANSITIONS: Record<string, { label: string; next: string }> = {
  draft: { label: "Planung starten", next: "active" },
  active: { label: "Konzept finalisieren", next: "submitted" },
};

/* ── Next step button ── */
function NextStepButton({ activeStep, setActiveStep, steps }: { activeStep: number; setActiveStep: (n: number) => void; steps: WorkflowStep[] }) {
  if (activeStep >= steps.length - 1) return null;
  const next = steps[activeStep + 1];
  return (
    <div className="mt-8 pt-4 border-t border-border flex justify-end">
      <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setActiveStep(activeStep + 1)}>
        Weiter: {next.label} <ArrowRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}

/* ── Guidance card ── */
function GuidanceCard({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md px-4 py-3 flex items-start gap-3 mb-4">
      <Icon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-[12px] text-amber-700 dark:text-amber-400">{text}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN WORKSPACE
   ══════════════════════════════════════════════ */
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  const projectId = id!;

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          workspaces(name, organizations(name)),
          jurisdiction_pack_versions(
            id, version_number, version_label, status, ruleset,
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

  /* Data queries for step completion checks */
  const { data: sitesData } = useQuery({
    queryKey: ["project-sites", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("project_sites").select("id").eq("project_id", projectId);
      return data ?? [];
    },
    enabled: !!project,
  });
  const { data: conceptsData } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("mobility_concepts").select("id").eq("project_id", projectId);
      return data ?? [];
    },
    enabled: !!project,
  });
  const { data: scenariosData } = useQuery({
    queryKey: ["scenarios", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("scenarios").select("id").eq("project_id", projectId);
      return data ?? [];
    },
    enabled: !!project,
  });
  const { data: monitoringData } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("monitoring_items").select("id").eq("project_id", projectId);
      return data ?? [];
    },
    enabled: !!project,
  });
  const { data: outputPkgs } = useQuery({
    queryKey: ["output_packages", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("output_packages").select("id").eq("project_id", projectId);
      return data ?? [];
    },
    enabled: !!project,
  });

  /* Step completion logic */
  const workflowSteps: WorkflowStep[] = useMemo(() => {
    if (!project) return WORKFLOW_STEPS.map(s => ({ ...s, completed: false }));
    return WORKFLOW_STEPS.map(s => ({
      ...s,
      completed:
        s.id === 0 ? (sitesData?.length ?? 0) > 0 && (conceptsData?.length ?? 0) > 0 :
        s.id === 1 ? project.mobility_factor != null :
        s.id === 2 ? project.status === "submitted" || project.status === "approved" || (scenariosData?.length ?? 0) > 0 :
        s.id === 3 ? (monitoringData?.length ?? 0) > 0 :
        s.id === 4 ? (outputPkgs?.length ?? 0) > 0 :
        false,
    }));
  }, [project, sitesData, conceptsData, scenariosData, monitoringData, outputPkgs]);

  /* Get active tab based on step + sub-tab */
  const currentStep = workflowSteps[activeStep] ?? workflowSteps[0];
  const currentTab = activeSubTab && currentStep.tabs.includes(activeSubTab)
    ? activeSubTab
    : currentStep.tabs[0];

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    setActiveSubTab(null);
  };

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from("projects").update({ status: newStatus as any }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      const msgs: Record<string, string> = {
        active: "Planung gestartet",
        submitted: "Konzept wurde finalisiert",
        approved: "Behördliche Genehmigung bestätigt",
      };
      toast.success(msgs[newStatus] ?? "Projektstatus aktualisiert");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
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
  const transition = STATUS_TRANSITIONS[project.status];
  const mf = project.mobility_factor != null ? Number(project.mobility_factor) : null;
  const standardThreshold = (jpv?.ruleset as any)?.calculation_engine?.standard_threshold ?? 0.8;

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
              {/* FIX 6: MF Status Chip */}
              {mf != null && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${
                  mf >= standardThreshold
                    ? "bg-green-50 border-green-300 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300"
                    : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
                }`}>
                  MF&nbsp;=&nbsp;{mf.toFixed(2).replace(".", ",")}
                  <span className="font-normal">{mf >= standardThreshold ? "Standard" : "Erweitert"}</span>
                </span>
              )}
              <ActionIcon icon={Pencil} onClick={() => setEditProjectOpen(true)} title="Projekt bearbeiten" />
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
          <div className="flex items-center gap-2">
            {/* FIX 4: Context buttons */}
            {project.status === "active" && mf == null && (
              <Button variant="outline" size="sm" className="h-8 text-[13px]"
                onClick={() => { setActiveStep(1); setActiveSubTab("calculator"); }}>
                <Calculator className="h-3.5 w-3.5 mr-1" /> MF berechnen
              </Button>
            )}
            {(project.status === "submitted" || project.status === "approved") && (
              <Button variant="outline" size="sm" className="h-8 text-[13px]"
                onClick={() => { setActiveStep(4); setActiveSubTab("documents"); }}>
                <Download className="h-3.5 w-3.5 mr-1" /> Formblatt
              </Button>
            )}
            {transition && (
              <Button size="sm" className={`h-8 text-[13px] ${transition.next === 'submitted' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}
                onClick={() => transition.next === 'submitted' ? setSubmitConfirmOpen(true) : statusMutation.mutate(transition.next)}
                disabled={statusMutation.isPending}>
                {statusMutation.isPending ? "…" : transition.label}
              </Button>
            )}
            {project.status === 'submitted' && (
              <Button size="sm" className="h-8 text-[13px]"
                onClick={() => setApproveConfirmOpen(true)}
                disabled={statusMutation.isPending}>
                Als behördlich genehmigt markieren
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowStepper steps={workflowSteps} activeStep={activeStep} onStepClick={handleStepClick} />

      {/* Tabs (controlled) */}
      <Tabs value={currentTab} onValueChange={(val) => setActiveSubTab(val)} className="flex-1 flex flex-col">
        {/* Sub-tabs only if current step has multiple tabs */}
        {currentStep.tabs.length > 1 && (
          <div className="border-b border-border bg-card px-6 overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-0 flex-nowrap">
              {currentStep.tabs.map((tab) => {
                const subLabel: Record<string, string> = {
                  usetypes: "Nutzungen & Bilanz",
                  calculator: "Kalkulator",
                  compliance: "Nachweisführung",
                  concepts: "Konzepte",
                  scenarios: "Szenarien & Maßnahmen",
                };
                return (
                  <TabsTrigger key={tab} value={tab} className={tabClass}>
                    {subLabel[tab] ?? tab}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="p-6 mt-0">
            <OverviewTab projectId={project.id} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="usetypes" className="p-6 mt-0">
            <UseTypesTab projectId={project.id} onNavigate={(tab) => { if (tab === "calculator") setActiveSubTab("calculator"); }} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="calculator" className="p-6 mt-0">
            <CalculatorTab projectId={project.id} project={project} onNavigate={(tab) => {
              if (tab === "compliance") { setActiveStep(2); setActiveSubTab("compliance"); }
              else if (tab === "scenarios") { setActiveStep(2); setActiveSubTab("scenarios"); }
            }} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="compliance" className="p-6 mt-0">
            <ComplianceTab projectId={project.id} project={project} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="concepts" className="p-6 mt-0">
            <ConceptsTab projectId={project.id} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="scenarios" className="p-6 mt-0">
            <ScenariosTab projectId={project.id} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="monitoring" className="p-6 mt-0">
            <MonitoringTab projectId={project.id} />
            <NextStepButton activeStep={activeStep} setActiveStep={setActiveStep} steps={workflowSteps} />
          </TabsContent>
          <TabsContent value="documents" className="p-6 mt-0">
            <DocumentsTab projectId={project.id} project={project} />
          </TabsContent>
        </div>
      </Tabs>

      <EditProjectDialog open={editProjectOpen} onOpenChange={setEditProjectOpen} project={project} />
      <SubmitConfirmDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen} projectId={project.id} statusMutation={statusMutation} />
      <ApproveConfirmDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen} projectId={project.id} statusMutation={statusMutation} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   EDIT PROJECT DIALOG
   ══════════════════════════════════════════════ */
function EditProjectDialog({ open, onOpenChange, project }: { open: boolean; onOpenChange: (v: boolean) => void; project: any }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [status, setStatus] = useState(project.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").update({
        name: name.trim(),
        description: description.trim() || null,
        status: status as any,
      }).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projekt aktualisiert");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setName(project.name); setDescription(project.description || ""); setStatus(project.status); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Projekt bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="active">In Bearbeitung</SelectItem>
                <SelectItem value="submitted">Finalisiert</SelectItem>
                <SelectItem value="approved">Behördlich genehmigt</SelectItem>
                <SelectItem value="archived">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   GENERIC DELETE CONFIRM
   ══════════════════════════════════════════════ */
function DeleteConfirm({ open, onOpenChange, title, description, onConfirm, isPending }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string; onConfirm: () => void; isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-[13px]">Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px]">
            {isPending ? "Löscht…" : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════ */
function OverviewTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [createSiteOpen, setCreateSiteOpen] = useState(false);
  const [editSite, setEditSite] = useState<any>(null);
  const [deleteSiteId, setDeleteSiteId] = useState<string | null>(null);

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

  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const { error } = await supabase.from("project_sites").delete().eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-sites", projectId] });
      toast.success("Standort gelöscht");
      setDeleteSiteId(null);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
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
              <TableHead className={thClass} />
            </TableRow></TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className={`font-medium ${tdClass}`}>{s.name}</TableCell>
                  <TableCell className={tdMuted}>{s.address || "–"}</TableCell>
                  <TableCell className={`${tdMuted} tabular-nums`}>{s.area_sqm != null ? Number(s.area_sqm).toLocaleString("de-DE") : "–"}</TableCell>
                  <TableCell className={tdMuted}>{format(new Date(s.created_at), "dd.MM.yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ActionIcon icon={Pencil} onClick={() => setEditSite(s)} title="Bearbeiten" />
                      <ActionIcon icon={Trash2} onClick={() => setDeleteSiteId(s.id)} title="Löschen" variant="destructive" />
                    </div>
                  </TableCell>
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

      {/* Submission Snapshots */}
      <SnapshotsSection projectId={projectId} />

      <CreateSiteDialog open={createSiteOpen} onOpenChange={setCreateSiteOpen} projectId={projectId} />
      {editSite && <EditSiteDialog open={!!editSite} onOpenChange={(v) => !v && setEditSite(null)} site={editSite} projectId={projectId} />}
      <DeleteConfirm open={!!deleteSiteId} onOpenChange={(v) => !v && setDeleteSiteId(null)} title="Standort löschen?" description="Dieser Standort wird unwiderruflich gelöscht." onConfirm={() => deleteSiteId && deleteSiteMutation.mutate(deleteSiteId)} isPending={deleteSiteMutation.isPending} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   USE TYPES TAB (P2)
   ══════════════════════════════════════════════ */
function UseTypesTab({ projectId, onNavigate }: { projectId: string; onNavigate?: (tab: string) => void }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: useTypes, isLoading } = useQuery({
    queryKey: ["use-types", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("use_types").select("*").eq("project_id", projectId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (utId: string) => {
      const { error } = await supabase.from("use_types").delete().eq("id", utId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["use-types", projectId] });
      toast.success("Nutzungsart gelöscht");
      setDeleteId(null);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <div className="max-w-4xl">
      <TabToolbar label="Nutzungsarten & Stellplatzbilanz" count={useTypes?.length}>
        <Button size="sm" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Nutzung anlegen
        </Button>
      </TabToolbar>
      {isLoading ? <LoadingSkeleton /> :
       !useTypes?.length ? (
        /* FIX 3: Enhanced empty state */
        <div className="border border-border rounded-md bg-card p-6 text-center space-y-3">
          <Home className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <p className="text-[14px] font-medium text-foreground">Noch keine Nutzungsarten erfasst</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-md mx-auto">
              Tragen Sie die Wohnungstypen Ihres Vorhabens ein – z.B. 60 Wohneinheiten München Modell Miete (MMM).
              Der Kalkulator berechnet daraus automatisch den Stellplatzbedarf.
            </p>
          </div>
          <Button size="sm" className="text-[13px]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nutzungsart anlegen
          </Button>
        </div>
      ) : (
        <>
        <Table>
          <TableHeader><TableRow>
            <TableHead className={thClass}>Bezeichnung</TableHead>
            <TableHead className={thClass}>Kategorie</TableHead>
            <TableHead className={thClass}>Wohnmodell</TableHead>
            <TableHead className={thClass}>Einheiten</TableHead>
            <TableHead className={thClass}>Richtwert</TableHead>
            <TableHead className={thClass}>BGF (m²)</TableHead>
            <TableHead className={thClass} />
          </TableRow></TableHeader>
          <TableBody>
            {useTypes.map((ut) => {
              const meta = (ut.metadata ?? {}) as Record<string, unknown>;
              const htCode = meta.housing_type_code as string | undefined;
              const parkRate = meta.parking_rate as number | undefined;
              return (
                <TableRow key={ut.id}>
                  <TableCell className={`font-medium ${tdClass}`}>{ut.name}</TableCell>
                  <TableCell className={tdMuted}>{ut.category || "–"}</TableCell>
                  <TableCell>
                    {htCode ? (
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-5 rounded">{htCode}</Badge>
                    ) : (
                      <span className={tdMuted}>–</span>
                    )}
                  </TableCell>
                  <TableCell className={`${tdMuted} tabular-nums`}>{ut.unit_count ?? "–"}</TableCell>
                  <TableCell className={`${tdMuted} tabular-nums`}>{parkRate != null ? `${parkRate} StP/WE` : "–"}</TableCell>
                  <TableCell className={`${tdMuted} tabular-nums`}>{ut.gross_floor_area_sqm != null ? Number(ut.gross_floor_area_sqm).toLocaleString("de-DE") : "–"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ActionIcon icon={Pencil} onClick={() => setEditItem(ut)} title="Bearbeiten" />
                      <ActionIcon icon={Trash2} onClick={() => setDeleteId(ut.id)} title="Löschen" variant="destructive" />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Stellplatz-Zusammenfassung aus Wohnmodellen */}
        {(() => {
          const rowsWithRate = useTypes.filter((ut) => {
            const meta = (ut.metadata ?? {}) as Record<string, unknown>;
            return meta.housing_type_code && meta.parking_rate;
          });
          if (!rowsWithRate.length) return null;
          const sumN = rowsWithRate.reduce((s, ut) => {
            const meta = (ut.metadata ?? {}) as Record<string, unknown>;
            return s + Math.ceil((ut.unit_count ?? 0) * Number(meta.parking_rate));
          }, 0);
          return (
            <div className="mt-3 px-3 py-2 rounded border border-border bg-muted/20 text-[12px] font-medium text-foreground">
              Summe N = {sumN} notwendige Stellplätze (berechnet aus Wohnmodellen)
            </div>
          );
        })()}
        </>
      
      )}

      {/* Stellplatzbilanz Section */}
      {useTypes && useTypes.length > 0 && (
        <BilanzSection useTypes={useTypes} projectId={projectId} />
      )}

      <CreateUseTypeDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
      {editItem && <EditUseTypeDialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)} item={editItem} projectId={projectId} />}
      <DeleteConfirm open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)} title="Nutzungsart löschen?" description="Diese Nutzungsart wird unwiderruflich gelöscht." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isPending={deleteMutation.isPending} />
    </div>
  );
}

/* ── Stellplatzbilanz Section ── */
function BilanzSection({ useTypes, projectId }: { useTypes: any[]; projectId: string }) {
  const { data: scenarios } = useQuery({
    queryKey: ["scenarios-bilanz", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("total_reduction_pct, is_baseline").eq("project_id", projectId);
      if (error) throw error;
      return data;
    },
  });

  const categorySums: Record<string, number> = {};
  useTypes.forEach((ut) => {
    const cat = ut.category || "Sonstiges";
    categorySums[cat] = (categorySums[cat] || 0) + (ut.unit_count ?? 0);
  });

  const activeReduction = scenarios?.find(s => s.is_baseline)?.total_reduction_pct ?? scenarios?.[0]?.total_reduction_pct ?? null;

  return (
    <div className="mt-6 space-y-4">
      <div className="border border-border rounded-md bg-card p-4">
        <h3 className="text-[13px] font-medium text-foreground mb-3">Zusammenfassung nach Kategorie</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(categorySums).map(([cat, count]) => (
            <div key={cat} className="bg-muted/30 rounded px-3 py-2">
              <div className="text-[11px] text-muted-foreground">{cat}</div>
              <div className="text-[15px] font-semibold text-foreground tabular-nums">{count} Einheiten</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-md bg-card p-4">
        <h3 className="text-[13px] font-medium text-foreground mb-1">Stellplatzbilanz</h3>
        <p className="text-[11px] text-muted-foreground mb-3">Die Stellplatzbilanz wird auf Basis der Nutzungsarten und der kommunalen Stellplatzsatzung berechnet.</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/30 rounded px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Pflichtstellplätze</div>
            <div className="text-[15px] font-semibold text-foreground">–</div>
          </div>
          <div className="bg-muted/30 rounded px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Beantragte Reduktion</div>
            <div className="text-[15px] font-semibold text-foreground tabular-nums">{activeReduction != null ? `${activeReduction}%` : "–"}</div>
          </div>
          <div className="bg-muted/30 rounded px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Verbleibend</div>
            <div className="text-[15px] font-semibold text-foreground">–</div>
          </div>
        </div>
      </div>
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
      const { data, error } = await supabase.from("scenarios").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
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
        /* FIX 3: Enhanced empty state */
        <div className="border border-border rounded-md bg-card p-6 text-center space-y-3">
          <GitBranch className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <p className="text-[14px] font-medium text-foreground">Noch keine Szenarien</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-md mx-auto">
              Szenarien beschreiben verschiedene Reduktionsstrategien. Beginnen Sie mit dem Basis-Szenario.
            </p>
          </div>
          <Button size="sm" className="text-[13px]" onClick={() => setCreateScenarioOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Erstes Szenario anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} projectId={projectId} />
          ))}
        </div>
      )}
      <CreateScenarioDialog open={createScenarioOpen} onOpenChange={setCreateScenarioOpen} projectId={projectId} />
    </>
  );
}

function ScenarioCard({ scenario, projectId }: { scenario: any; projectId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createMeasureOpen, setCreateMeasureOpen] = useState(false);
  const [editScenarioOpen, setEditScenarioOpen] = useState(false);
  const [deleteScenarioOpen, setDeleteScenarioOpen] = useState(false);
  const [editMeasure, setEditMeasure] = useState<any>(null);
  const [deleteMeasureId, setDeleteMeasureId] = useState<string | null>(null);

  const { data: measures, isLoading } = useQuery({
    queryKey: ["scenario-measures", scenario.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("measures").select("*").eq("scenario_id", scenario.id).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: justifications } = useQuery({
    queryKey: ["justifications", projectId, scenario.id],
    queryFn: async () => {
      const measureIds = measures?.map(m => m.id) ?? [];
      if (!measureIds.length) return [];
      const { data, error } = await supabase.from("justifications").select("*").eq("project_id", projectId).in("measure_id", measureIds).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: open && !!measures?.length,
  });

  const { data: assumptions } = useQuery({
    queryKey: ["assumptions", scenario.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assumptions").select("*").eq("scenario_id", scenario.id).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scenarios").delete().eq("id", scenario.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
      toast.success("Szenario gelöscht");
      setDeleteScenarioOpen(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  const deleteMeasureMutation = useMutation({
    mutationFn: async (mId: string) => {
      const { error } = await supabase.from("measures").delete().eq("id", mId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenario-measures", scenario.id] });
      toast.success("Maßnahme gelöscht");
      setDeleteMeasureId(null);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
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
                  {scenario.is_baseline && <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-0">Baseline</Badge>}
                </div>
                {scenario.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-lg truncate">{scenario.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {scenario.total_reduction_pct != null && (
                <span className="text-[12px] text-muted-foreground tabular-nums">Zielreduktion: {scenario.total_reduction_pct}%</span>
              )}
              <ActionIcon icon={Pencil} onClick={() => setEditScenarioOpen(true)} title="Szenario bearbeiten" />
              <ActionIcon icon={Trash2} onClick={() => setDeleteScenarioOpen(true)} title="Szenario löschen" variant="destructive" />
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
                  <TableHead className={thClass} />
                </TableRow></TableHeader>
                <TableBody>
                  {measures.map((m) => (
                    <React.Fragment key={m.id}>
                      <TableRow>
                        <TableCell className={`font-medium ${tdClass}`}>{m.name}</TableCell>
                        <TableCell className={tdMuted}>{m.category || "–"}</TableCell>
                        <TableCell className={`${tdMuted} tabular-nums`}>
                          {m.reduction_value != null ? `${m.reduction_value} ${m.reduction_unit || ""}`.trim() : "–"}
                        </TableCell>
                        <TableCell><StatusBadge status={m.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ActionIcon icon={Pencil} onClick={() => setEditMeasure(m)} title="Bearbeiten" />
                            <ActionIcon icon={Trash2} onClick={() => setDeleteMeasureId(m.id)} title="Löschen" variant="destructive" />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="pt-0 pb-1">
                          <EvidenceSection measureId={m.id} projectId={projectId} />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}

            {measures && measures.length > 0 && (() => {
              const spSum = measures.reduce((s, m) => s + (m.reduction_unit === "Stellplätze" && m.reduction_value ? Number(m.reduction_value) : 0), 0);
              const pctSum = measures.reduce((s, m) => s + (m.reduction_unit === "%" && m.reduction_value ? Number(m.reduction_value) : 0), 0);
              const target = scenario.total_reduction_pct;
              const met = target != null && pctSum >= target;
              return (
                <div className={`mt-2 px-3 py-2 rounded text-[12px] font-medium border ${met ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400" : "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-400"}`}>
                  Gesamtreduktion: {spSum > 0 ? `${spSum} Stellplätze` : ""}{spSum > 0 && pctSum > 0 ? " / " : ""}{pctSum > 0 ? `${pctSum}%` : ""}{spSum === 0 && pctSum === 0 ? "–" : ""}
                  {target != null && <span className="ml-2 text-[11px] font-normal">(Ziel: {target}%)</span>}
                </div>
              );
            })()}

            {open && (
              <JustificationsSection projectId={projectId} scenarioMeasures={measures ?? []} />
            )}

            {open && (
              <AssumptionsSection projectId={projectId} scenarioId={scenario.id} assumptions={assumptions ?? []} />
            )}
          </div>

          <CreateMeasureDialog open={createMeasureOpen} onOpenChange={setCreateMeasureOpen} scenarioId={scenario.id} projectId={projectId} />
          {editMeasure && <EditMeasureDialog open={!!editMeasure} onOpenChange={(v) => !v && setEditMeasure(null)} measure={editMeasure} scenarioId={scenario.id} />}
          <DeleteConfirm open={!!deleteMeasureId} onOpenChange={(v) => !v && setDeleteMeasureId(null)} title="Maßnahme löschen?" description="Diese Maßnahme wird unwiderruflich gelöscht." onConfirm={() => deleteMeasureId && deleteMeasureMutation.mutate(deleteMeasureId)} isPending={deleteMeasureMutation.isPending} />
        </CollapsibleContent>
      </div>
      {editScenarioOpen && <EditScenarioDialog open={editScenarioOpen} onOpenChange={setEditScenarioOpen} scenario={scenario} projectId={projectId} />}
      <DeleteConfirm open={deleteScenarioOpen} onOpenChange={setDeleteScenarioOpen} title="Szenario löschen?" description="Dieses Szenario und alle zugehörigen Maßnahmen werden unwiderruflich gelöscht." onConfirm={() => deleteScenarioMutation.mutate()} isPending={deleteScenarioMutation.isPending} />
    </Collapsible>
  );
}

/* ══════════════════════════════════════════════
   JUSTIFICATIONS SECTION (P3)
   ══════════════════════════════════════════════ */
function JustificationsSection({ projectId, scenarioMeasures }: { projectId: string; scenarioMeasures: any[] }) {
  const queryClient = useQueryClient();
  const [sectionOpen, setSectionOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const measureIds = scenarioMeasures.map(m => m.id);

  const { data: justifications } = useQuery({
    queryKey: ["justifications", projectId, measureIds.join(",")],
    queryFn: async () => {
      if (!measureIds.length) return [];
      const { data, error } = await supabase.from("justifications").select("*").eq("project_id", projectId).in("measure_id", measureIds).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: sectionOpen && measureIds.length > 0,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [jType, setJType] = useState("");
  const [measureId, setMeasureId] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("justifications").insert({
        project_id: projectId,
        measure_id: measureId || null,
        title: title.trim(),
        content: content.trim() || null,
        justification_type: jType.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justifications", projectId] });
      toast.success("Begründung angelegt");
      setCreateOpen(false);
      setTitle(""); setContent(""); setJType(""); setMeasureId("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
      <div className="mt-4 border-t border-border pt-3">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            {sectionOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Scale className="h-3.5 w-3.5" />
            Begründungen ({justifications?.length ?? 0})
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Begründung
              </Button>
            </div>
            {!justifications?.length ? (
              <p className="text-[12px] text-muted-foreground py-1">Keine Begründungen vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {justifications.map((j) => (
                  <div key={j.id} className="bg-muted/30 rounded p-3 text-[12px]">
                    <div className="font-medium text-foreground">{j.title}</div>
                    {j.content && <p className="text-muted-foreground mt-1">{j.content}</p>}
                    {j.justification_type && <span className="text-[11px] font-mono text-muted-foreground mt-1 block">{j.justification_type}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-[15px]">Begründung anlegen</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Titel *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Nachweis ÖPNV-Anbindung" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Maßnahme</Label>
                  <Select value={measureId} onValueChange={setMeasureId}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Maßnahme wählen…" /></SelectTrigger>
                    <SelectContent>
                      {scenarioMeasures.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-[13px]">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Rechtsgrundlage / Typ</Label>
                  <Input value={jType} onChange={(e) => setJType(e.target.value)} placeholder="z. B. § 12 Abs. 3 StSpS München" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Inhalt</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Begründungstext…" className="text-[13px] min-h-[60px]" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="text-[13px]">Abbrechen</Button>
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="text-[13px]">
                  {createMutation.isPending ? "Erstellt…" : "Anlegen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ══════════════════════════════════════════════
   ASSUMPTIONS SECTION (P3)
   ══════════════════════════════════════════════ */
function AssumptionsSection({ projectId, scenarioId, assumptions }: { projectId: string; scenarioId: string; assumptions: any[] }) {
  const queryClient = useQueryClient();
  const [sectionOpen, setSectionOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState("");
  const [source, setSource] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assumptions").insert({
        project_id: projectId,
        scenario_id: scenarioId,
        title: title.trim(),
        description: description.trim() || null,
        confidence: confidence || null,
        source: source.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assumptions", scenarioId] });
      toast.success("Annahme angelegt");
      setCreateOpen(false);
      setTitle(""); setDescription(""); setConfidence(""); setSource("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
      <div className="mt-3 border-t border-border pt-3">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            {sectionOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <BookOpen className="h-3.5 w-3.5" />
            Annahmen ({assumptions?.length ?? 0})
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Annahme
              </Button>
            </div>
            {!assumptions?.length ? (
              <p className="text-[12px] text-muted-foreground py-1">Keine Annahmen vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {assumptions.map((a) => (
                  <div key={a.id} className="bg-muted/30 rounded p-3 text-[12px]">
                    <div className="font-medium text-foreground">{a.title}</div>
                    {a.description && <p className="text-muted-foreground mt-1">{a.description}</p>}
                    <div className="flex gap-3 mt-1">
                      {a.confidence && <span className="text-[11px] text-muted-foreground">Konfidenz: {a.confidence}</span>}
                      {a.source && <span className="text-[11px] text-muted-foreground">Quelle: {a.source}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-[15px]">Annahme anlegen</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Titel *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. ÖPNV-Taktung ab 2026" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Konfidenz</Label>
                  <Select value={confidence} onValueChange={setConfidence}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Wählen…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoch">Hoch</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Quelle</Label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="z. B. MVV-Nahverkehrsplan 2025" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Beschreibung</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" className="text-[13px] min-h-[60px]" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="text-[13px]">Abbrechen</Button>
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="text-[13px]">
                  {createMutation.isPending ? "Erstellt…" : "Anlegen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ══════════════════════════════════════════════
   MONITORING TAB
   ══════════════════════════════════════════════ */
function MonitoringTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("monitoring_items").select("*").eq("project_id", projectId).order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mId: string) => {
      const { error } = await supabase.from("monitoring_items").delete().eq("id", mId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-monitoring", projectId] });
      toast.success("Monitoring-Eintrag gelöscht");
      setDeleteId(null);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
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
        /* FIX 3: Enhanced empty state */
        <div className="border border-border rounded-md bg-card p-6 text-center space-y-3">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <p className="text-[14px] font-medium text-foreground">Monitoring-Intervalle noch nicht angelegt</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-md mx-auto">
              Laut Regelwerk sind Monitoring-Berichte nach 1, 4, 7 und 10 Jahren nach Nutzungsaufnahme einzureichen.
              Legen Sie jetzt die Fristen an.
            </p>
          </div>
          <Button size="sm" className="text-[13px]" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Monitoring-Eintrag anlegen
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead className={thClass}>Titel</TableHead>
            <TableHead className={thClass}>Status</TableHead>
            <TableHead className={thClass}>Fällig am</TableHead>
            <TableHead className={thClass}>Abgeschlossen</TableHead>
            <TableHead className={thClass} />
          </TableRow></TableHeader>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.id}>
                <TableCell className={`font-medium ${tdClass}`}>{m.title}</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell className={`${tdMuted} tabular-nums`}>{m.due_date ? format(new Date(m.due_date), "dd.MM.yyyy") : "–"}</TableCell>
                <TableCell className={tdMuted}>{m.completed_at ? format(new Date(m.completed_at), "dd.MM.yyyy") : "–"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ActionIcon icon={Pencil} onClick={() => setEditItem(m)} title="Bearbeiten" />
                    <ActionIcon icon={Trash2} onClick={() => setDeleteId(m.id)} title="Löschen" variant="destructive" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CreateMonitoringDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
      {editItem && <EditMonitoringDialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)} item={editItem} projectId={projectId} />}
      <DeleteConfirm open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)} title="Monitoring-Eintrag löschen?" description="Dieser Eintrag wird unwiderruflich gelöscht." onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} isPending={deleteMutation.isPending} />
    </>
  );
}

/* ══════════════════════════════════════════════
   DOCUMENTS TAB
   ══════════════════════════════════════════════ */
function DocumentsTab({ projectId, project }: { projectId: string; project: any }) {
  const [showFormblatt, setShowFormblatt] = useState(false);

  const { data: useTypes } = useQuery({
    queryKey: ["use_types_doc", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("use_types").select("*").eq("project_id", projectId).order("created_at");
      return data ?? [];
    },
  });

  const { data: sites } = useQuery({
    queryKey: ["project-sites-doc", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("project_sites").select("*").eq("project_id", projectId);
      return data ?? [];
    },
  });

  const { data: measures } = useQuery({
    queryKey: ["measures_doc", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("measures").select("*").eq("project_id", projectId);
      return data ?? [];
    },
  });

  const { data: outputPackages, isLoading: opLoading } = useQuery({
    queryKey: ["output_packages", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("output_packages").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const canGenerateFormblatt = project?.status === "submitted" || project?.status === "approved";
  const ruleset = (project?.jurisdiction_pack_versions as any)?.ruleset;
  const formTemplateId = ruleset?.submission?.form_template_id;
  const isFormSupported = formTemplateId === "munich_lbk_2023" || !formTemplateId;

  if (showFormblatt) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <FormblattViewer
          project={project}
          useTypes={useTypes ?? []}
          sites={sites ?? []}
          measures={measures ?? []}
          onClose={() => setShowFormblatt(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TabToolbar label="Dokumente & Formulare">
        {isFormSupported ? (
          <Button
            size="sm"
            className="h-8 text-[13px]"
            disabled={!canGenerateFormblatt}
            onClick={() => setShowFormblatt(true)}
            title={!canGenerateFormblatt ? "Erst Konzept finalisieren" : undefined}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Formblatt vorbereiten
          </Button>
        ) : null}
      </TabToolbar>

      {!isFormSupported && (
        <div className="rounded-md border border-border bg-accent/30 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-foreground">Kein digitales Formblatt verfügbar</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Für diese Kommune ist noch kein digitales Formblatt hinterlegt. Bitte laden Sie das Formblatt manuell von der zuständigen Behörde herunter.
            </p>
          </div>
        </div>
      )}

      {/* FIX 3: Enhanced empty state for documents */}
      {isFormSupported && canGenerateFormblatt && !outputPackages?.length && !opLoading && (
        <div className="border border-border rounded-md bg-card p-6 text-center space-y-3">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <p className="text-[14px] font-medium text-foreground">Bereit zur Einreichung</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-md mx-auto">
              Das Konzept ist finalisiert. Bereiten Sie jetzt das offizielle LBK-Formblatt vor – alle Daten werden automatisch eingetragen.
            </p>
          </div>
          <Button size="sm" className="text-[13px]" onClick={() => setShowFormblatt(true)}>
            <FileText className="h-3.5 w-3.5 mr-1" /> Formblatt vorbereiten
          </Button>
        </div>
      )}

      {isFormSupported && !canGenerateFormblatt && (
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <p className="text-[12px] text-muted-foreground">
            Das LBK-Formblatt kann erst nach Finalisierung des Konzepts erstellt werden.
          </p>
        </div>
      )}

      <div>
        <h3 className="text-[13px] font-medium text-foreground mb-3">Erzeugte Dokumente</h3>
        {opLoading ? <LoadingSkeleton rows={2} /> :
         !outputPackages?.length ? (
          <p className="text-[12px] text-muted-foreground">Noch keine Dokumente erzeugt.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className={thClass}>Dateiname</TableHead>
              <TableHead className={thClass}>Typ</TableHead>
              <TableHead className={thClass}>Erstellt am</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {outputPackages.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className={`${tdClass} font-mono`}>{op.file_name ?? op.name}</TableCell>
                  <TableCell className={tdMuted}>{op.package_type ?? "–"}</TableCell>
                  <TableCell className={tdMuted}>{format(new Date(op.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INLINE CREATE DIALOGS
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
        scenario_id: scenarioId, project_id: projectId, name: name.trim(),
        category: category.trim() || null, description: description.trim() || null,
        reduction_value: reductionValue ? parseFloat(reductionValue) : null,
        reduction_unit: reductionUnit || null, status: "proposed",
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
            <Label className="text-[13px]">Kategorie</Label>
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
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Maßnahme erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateMonitoringDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("monitoring_items").insert({
        project_id: projectId, title: title.trim(),
        description: description.trim() || null, due_date: dueDate || null,
        status: status as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-monitoring", projectId] });
      toast.success("Monitoring-Eintrag erstellt");
      onOpenChange(false);
      setTitle(""); setDescription(""); setDueDate(""); setStatus("pending");
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
            <Label className="text-[13px]">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="non_compliant">Nicht konform</SelectItem>
              </SelectContent>
            </Select>
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

function CreateUseTypeDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unitCount, setUnitCount] = useState("");
  const [gfa, setGfa] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("use_types").insert({
        project_id: projectId, name: name.trim(),
        category: category || null,
        unit_count: unitCount ? parseInt(unitCount, 10) : null,
        gross_floor_area_sqm: gfa ? parseFloat(gfa) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["use-types", projectId] });
      toast.success("Nutzungsart angelegt");
      onOpenChange(false);
      setName(""); setCategory(""); setUnitCount(""); setGfa("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Nutzungsart anlegen</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Bezeichnung *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Wohnnutzung Typ A" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Nutzungsart</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Wählen…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Wohnen">Wohnen</SelectItem>
                <SelectItem value="Büro">Büro</SelectItem>
                <SelectItem value="Gewerbe">Gewerbe</SelectItem>
                <SelectItem value="Einzelhandel">Einzelhandel</SelectItem>
                <SelectItem value="Sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Anzahl Einheiten</Label>
              <Input value={unitCount} onChange={(e) => setUnitCount(e.target.value)} type="number" placeholder="z. B. 120" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">BGF (m²)</Label>
              <Input value={gfa} onChange={(e) => setGfa(e.target.value)} type="number" placeholder="z. B. 8500" className="h-9 text-[13px]" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   EDIT DIALOGS
   ══════════════════════════════════════════════ */
function EditSiteDialog({ open, onOpenChange, site, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; site: any; projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(site.name);
  const [address, setAddress] = useState(site.address || "");
  const [areaSqm, setAreaSqm] = useState(site.area_sqm?.toString() || "");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_sites").update({
        name: name.trim(), address: address.trim() || null, area_sqm: areaSqm ? parseFloat(areaSqm) : null,
      }).eq("id", site.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-sites", projectId] });
      toast.success("Standort aktualisiert");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Standort bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Fläche (m²)</Label>
            <Input value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} type="number" className="h-9 text-[13px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditScenarioDialog({ open, onOpenChange, scenario, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; scenario: any; projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(scenario.name);
  const [description, setDescription] = useState(scenario.description || "");
  const [isBaseline, setIsBaseline] = useState(scenario.is_baseline);
  const [totalReduction, setTotalReduction] = useState(scenario.total_reduction_pct?.toString() || "");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scenarios").update({
        name: name.trim(), description: description.trim() || null,
        is_baseline: isBaseline, total_reduction_pct: totalReduction ? parseFloat(totalReduction) : null,
      }).eq("id", scenario.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
      toast.success("Szenario aktualisiert");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Szenario bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-[13px] min-h-[60px]" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="edit-baseline" checked={isBaseline} onCheckedChange={(v) => setIsBaseline(v === true)} />
            <Label htmlFor="edit-baseline" className="text-[13px]">Als Baseline markieren</Label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Zielreduktion (%)</Label>
            <Input value={totalReduction} onChange={(e) => setTotalReduction(e.target.value)} type="number" placeholder="z. B. 30" className="h-9 text-[13px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMeasureDialog({ open, onOpenChange, measure, scenarioId }: { open: boolean; onOpenChange: (v: boolean) => void; measure: any; scenarioId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(measure.name);
  const [category, setCategory] = useState(measure.category || "");
  const [description, setDescription] = useState(measure.description || "");
  const [reductionValue, setReductionValue] = useState(measure.reduction_value?.toString() || "");
  const [reductionUnit, setReductionUnit] = useState(measure.reduction_unit || "Stellplätze");
  const [status, setStatus] = useState(measure.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("measures").update({
        name: name.trim(), category: category.trim() || null, description: description.trim() || null,
        reduction_value: reductionValue ? parseFloat(reductionValue) : null,
        reduction_unit: reductionUnit || null, status,
      }).eq("id", measure.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenario-measures", scenarioId] });
      toast.success("Maßnahme aktualisiert");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Maßnahme bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Kategorie</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="proposed">Vorgeschlagen</SelectItem>
                <SelectItem value="approved">Freigegeben</SelectItem>
                <SelectItem value="implemented">Umgesetzt</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-[13px] min-h-[60px]" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Reduktionswert</Label>
              <Input value={reductionValue} onChange={(e) => setReductionValue(e.target.value)} type="number" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Einheit</Label>
              <Input value={reductionUnit} onChange={(e) => setReductionUnit(e.target.value)} className="h-9 text-[13px]" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMonitoringDialog({ open, onOpenChange, item, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; item: any; projectId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [dueDate, setDueDate] = useState(item.due_date || "");
  const [status, setStatus] = useState(item.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("monitoring_items").update({
        title: title.trim(), description: description.trim() || null,
        due_date: dueDate || null, status: status as any,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-monitoring", projectId] });
      toast.success("Monitoring-Eintrag aktualisiert");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Monitoring-Eintrag bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="compliant">Konform</SelectItem>
                <SelectItem value="non_compliant">Nicht konform</SelectItem>
                <SelectItem value="waived">Ausgenommen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Fälligkeitsdatum</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUseTypeDialog({ open, onOpenChange, item, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; item: any; projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category || "");
  const [unitCount, setUnitCount] = useState(item.unit_count?.toString() || "");
  const [gfa, setGfa] = useState(item.gross_floor_area_sqm?.toString() || "");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("use_types").update({
        name: name.trim(), category: category || null,
        unit_count: unitCount ? parseInt(unitCount, 10) : null,
        gross_floor_area_sqm: gfa ? parseFloat(gfa) : null,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["use-types", projectId] });
      toast.success("Nutzungsart aktualisiert");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Nutzungsart bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Bezeichnung *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Nutzungsart</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Wählen…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Wohnen">Wohnen</SelectItem>
                <SelectItem value="Büro">Büro</SelectItem>
                <SelectItem value="Gewerbe">Gewerbe</SelectItem>
                <SelectItem value="Einzelhandel">Einzelhandel</SelectItem>
                <SelectItem value="Sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Anzahl Einheiten</Label>
              <Input value={unitCount} onChange={(e) => setUnitCount(e.target.value)} type="number" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">BGF (m²)</Label>
              <Input value={gfa} onChange={(e) => setGfa(e.target.value)} type="number" className="h-9 text-[13px]" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   SUBMIT CONFIRM DIALOG (creates snapshot)
   ══════════════════════════════════════════════ */
function SubmitConfirmDialog({ open, onOpenChange, projectId, statusMutation }: {
  open: boolean; onOpenChange: (v: boolean) => void; projectId: string; statusMutation: any;
}) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      const { error: statusErr } = await supabase.from("projects").update({
        status: "submitted" as any,
        mf_calculation_locked: true,
      }).eq("id", projectId);
      if (statusErr) throw statusErr;

      const [sitesRes, conceptsRes, scenariosRes, projectRes, useTypesRes, baselineRes, measuresRes, monitoringRes] = await Promise.all([
        supabase.from("project_sites").select("*").eq("project_id", projectId),
        supabase.from("mobility_concepts").select("*").eq("project_id", projectId),
        supabase.from("scenarios").select("*").eq("project_id", projectId),
        supabase.from("projects").select("*, jurisdiction_pack_versions(version_label)").eq("id", projectId).maybeSingle(),
        supabase.from("use_types").select("*").eq("project_id", projectId),
        supabase.from("baseline_requirements").select("*").eq("project_id", projectId),
        supabase.from("measures").select("*").eq("project_id", projectId),
        supabase.from("monitoring_items").select("*").eq("project_id", projectId),
      ]);

      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;
      const proj = projectRes.data;

      const { error: snapErr } = await supabase.from("submission_snapshots").insert({
        project_id: projectId,
        version_label: "v" + new Date().toISOString().slice(0, 10),
        snapshot_data: {
          project: {
            name: proj?.name,
            description: proj?.description,
            status: "submitted",
            erected_parking_spaces: proj?.erected_parking_spaces,
            mobility_factor: proj?.mobility_factor,
            jurisdiction_pack: (proj?.jurisdiction_pack_versions as any)?.version_label,
          },
          sites: sitesRes.data ?? [],
          use_types: useTypesRes.data ?? [],
          baseline_requirements: baselineRes.data ?? [],
          scenarios: scenariosRes.data ?? [],
          measures: measuresRes.data ?? [],
          monitoring_items: monitoringRes.data ?? [],
        },
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
      });
      if (snapErr) throw snapErr;

      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["submission-snapshots", projectId] });
      toast.success("Konzept wurde finalisiert – Snapshot erstellt");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px]">Konzept finalisieren?</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">
            Das Konzept wird als abgeschlossen markiert und eingefroren. Alle Planungsdaten werden als revisionssicherer Snapshot gespeichert. Änderungen sind danach nicht mehr möglich. Das Konzept kann anschließend für die Behördeneinreichung vorbereitet werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-[13px]">Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px]">
            {isPending ? "Wird finalisiert…" : "Jetzt finalisieren"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ══════════════════════════════════════════════
   APPROVE CONFIRM DIALOG
   ══════════════════════════════════════════════ */
function ApproveConfirmDialog({ open, onOpenChange, projectId, statusMutation }: {
  open: boolean; onOpenChange: (v: boolean) => void; projectId: string; statusMutation: any;
}) {
  const [aktenzeichen, setAktenzeichen] = useState("");
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const handleApprove = async () => {
    setIsPending(true);
    try {
      const updateData: any = { status: "approved" as any };
      if (aktenzeichen.trim()) {
        updateData.description = aktenzeichen.trim();
      }
      const { error } = await supabase.from("projects").update(updateData).eq("id", projectId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Behördliche Genehmigung bestätigt");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px]">Behördliche Genehmigung bestätigen?</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">
            Bitte bestätigen Sie, dass das Mobilitätskonzept durch die zuständige Behörde genehmigt wurde. Tragen Sie ggf. das Aktenzeichen ein.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Input
            placeholder="Aktenzeichen der Lokalbaukommission (optional)"
            value={aktenzeichen}
            onChange={(e) => setAktenzeichen(e.target.value)}
            className="h-9 text-[13px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-[13px]">Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleApprove} disabled={isPending} className="text-[13px]">
            {isPending ? "Wird bestätigt…" : "Genehmigung bestätigen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ══════════════════════════════════════════════
   SNAPSHOTS SECTION (in Overview tab)
   ══════════════════════════════════════════════ */
function SnapshotsSection({ projectId }: { projectId: string }) {
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["submission-snapshots", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("submission_snapshots").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <TabToolbar label="Finalisierungen" count={snapshots?.length} />
      {isLoading ? <LoadingSkeleton rows={2} /> :
       !snapshots?.length ? (
        <p className="text-[13px] text-muted-foreground">Noch keine Finalisierung. Nach der Finalisierung wird hier ein revisionssicherer Snapshot des Konzeptstands gespeichert.</p>
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead className={thClass}>Version</TableHead>
            <TableHead className={thClass}>Finalisiert am</TableHead>
            <TableHead className={thClass}>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {snapshots.map((s) => (
              <TableRow key={s.id}>
                <TableCell className={`font-medium ${tdClass} font-mono`}>{s.version_label}</TableCell>
                <TableCell className={tdMuted}>{s.submitted_at ? format(new Date(s.submitted_at), "dd.MM.yyyy HH:mm") : "–"}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">Finalisiert</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   EVIDENCE ARTIFACTS SECTION
   ══════════════════════════════════════════════ */
function EvidenceSection({ measureId, projectId }: { measureId: string; projectId: string }) {
  const queryClient = useQueryClient();
  const [sectionOpen, setSectionOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [artifactType, setArtifactType] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");

  const { data: artifacts } = useQuery({
    queryKey: ["evidence_artifacts", measureId],
    queryFn: async () => {
      const { data, error } = await supabase.from("evidence_artifacts").select("*").eq("measure_id", measureId).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: sectionOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase.from("evidence_artifacts").insert({
        project_id: projectId,
        measure_id: measureId,
        name: name.trim(),
        artifact_type: artifactType || null,
        file_name: fileName.trim(),
        file_path: filePath.trim() || fileName.trim(),
        uploaded_by: session.session?.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence_artifacts", measureId] });
      toast.success("Nachweis wurde erfasst");
      setCreateOpen(false);
      setName(""); setArtifactType(""); setFileName(""); setFilePath("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
      <div className="mt-1">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            {sectionOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Paperclip className="h-3 w-3" />
            Nachweise ({artifacts?.length ?? 0})
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 ml-5 space-y-1.5">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-2.5 w-2.5 mr-0.5" /> Nachweis
              </Button>
            </div>
            {!artifacts?.length ? (
              <p className="text-[11px] text-muted-foreground py-0.5">Keine Nachweise hinterlegt.</p>
            ) : (
              <div className="space-y-1">
                {artifacts.map((a) => (
                  <div key={a.id} className="bg-muted/30 rounded px-2.5 py-1.5 text-[11px] flex items-center gap-3">
                    <span className="font-medium text-foreground">{a.name}</span>
                    {a.artifact_type && <span className="text-muted-foreground">{a.artifact_type}</span>}
                    <span className="text-muted-foreground font-mono">{a.file_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-[15px]">Nachweis erfassen</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Bezeichnung *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Carsharing-Vertrag" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Typ</Label>
                  <Select value={artifactType} onValueChange={setArtifactType}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Wählen…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vertrag">Vertrag</SelectItem>
                      <SelectItem value="Foto">Foto</SelectItem>
                      <SelectItem value="Zertifikat">Zertifikat</SelectItem>
                      <SelectItem value="Behördennachweis">Behördennachweis</SelectItem>
                      <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Dateiname / URL *</Label>
                  <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="z. B. vertrag_carsharing.pdf" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Speicherort / Pfad</Label>
                  <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="Optional" className="h-9 text-[13px]" />
                </div>
                <p className="text-[11px] text-muted-foreground">Datei-Upload kommt in der nächsten Version. Bitte erfassen Sie den Dateinamen und Speicherort.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="text-[13px]">Abbrechen</Button>
                <Button size="sm" onClick={() => createMutation.mutate()} disabled={!name.trim() || !fileName.trim() || createMutation.isPending} className="text-[13px]">
                  {createMutation.isPending ? "Erfasst…" : "Erfassen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
