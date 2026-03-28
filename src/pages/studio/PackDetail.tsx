import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  ChevronLeft, Plus, Layers, FileText, BookOpen, Scale,
  CheckCircle, TestTube, Rocket, Clock, Map, LayoutTemplate, Info, AlertTriangle,
} from "lucide-react";
import { CreatePackVersionDialog } from "@/components/dialogs/CreatePackVersionDialog";
import { CreateSourceDocumentDialog } from "@/components/dialogs/CreateSourceDocumentDialog";
import { CreateRuleSetDialog } from "@/components/dialogs/CreateRuleSetDialog";
import { CreateReviewDialog } from "@/components/dialogs/CreateReviewDialog";
import { CreateTestCaseDialog } from "@/components/dialogs/CreateTestCaseDialog";
import { CreateReleaseDialog } from "@/components/dialogs/CreateReleaseDialog";

const tabClass =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-[13px] font-normal data-[state=active]:font-medium";
const thClass = "text-[12px]";
const tdClass = "text-[13px]";
const tdMuted = "text-[12px] text-muted-foreground";

function TabToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between mb-4">{children}</div>;
}

export default function PackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const { data: pack, isLoading } = useQuery({
    queryKey: ["pack-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jurisdiction_packs")
        .select("*, municipalities(name, id), jurisdiction_pack_versions(id, version_number, version_label, status, effective_date, created_at, changelog)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== ":id",
  });

  const versions = Array.isArray(pack?.jurisdiction_pack_versions) ? pack.jurisdiction_pack_versions : [];
  const activeVersionId = selectedVersionId || versions[0]?.id || "";
  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const municipalityId = pack?.municipalities && !Array.isArray(pack.municipalities) ? pack.municipalities.id : "";

  if (isLoading) return <div className="p-6 text-[13px] text-muted-foreground">Lädt…</div>;
  if (!pack) return <div className="p-6 text-[13px] text-muted-foreground">Pack nicht gefunden.</div>;

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => navigate("/studio/packs")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-[15px] font-semibold leading-tight">{pack.name}</h1>
          <StatusBadge status={pack.status} />
        </div>
        {pack.description && (
          <p className="text-[12px] text-muted-foreground ml-8 max-w-2xl">{pack.description}</p>
        )}
        <div className="flex items-center gap-4 mt-1.5 ml-8 text-[11px] text-muted-foreground/70">
          <span>Kommune: {pack.municipalities && !Array.isArray(pack.municipalities) ? pack.municipalities.name : "–"}</span>
          <span>·</span>
          <span>{versions.length} Version{versions.length !== 1 ? "en" : ""}</span>
          <span>·</span>
          <span>Aktualisiert {format(new Date(pack.updated_at), "dd.MM.yyyy")}</span>
        </div>
        {versions.length > 0 && (
          <div className="ml-8 mt-2 flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Aktive Version:</span>
            <Select value={activeVersionId} onValueChange={setSelectedVersionId}>
              <SelectTrigger className="h-7 w-48 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-[12px]">
                    {v.version_label || `v${v.version_number}`} — {v.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeVersion && <StatusBadge status={activeVersion.status} />}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b border-border bg-card px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-0 flex-wrap">
            <TabsTrigger value="overview" className={tabClass}>Übersicht</TabsTrigger>
            <TabsTrigger value="versions" className={tabClass}>Versionen</TabsTrigger>
            <TabsTrigger value="documents" className={tabClass}>Quelldokumente</TabsTrigger>
            <TabsTrigger value="candidates" className={tabClass}>Kandidaten</TabsTrigger>
            <TabsTrigger value="rules" className={tabClass}>Regeln</TabsTrigger>
            <TabsTrigger value="rulesets" className={tabClass}>Regelsets</TabsTrigger>
            <TabsTrigger value="zones" className={tabClass}>Zonen</TabsTrigger>
            <TabsTrigger value="templates" className={tabClass}>Templates</TabsTrigger>
            <TabsTrigger value="reviews" className={tabClass}>Prüfungen</TabsTrigger>
            <TabsTrigger value="tests" className={tabClass}>Tests</TabsTrigger>
            <TabsTrigger value="releases" className={tabClass}>Releases</TabsTrigger>
            <TabsTrigger value="changelog" className={tabClass}>Change Log</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="p-6 mt-0">
          <PackOverviewTab packVersionId={activeVersionId} municipalityId={municipalityId} versions={versions} />
          <div className="px-6 pb-6"><RulesetViewerSection packVersionId={activeVersionId} /></div>
        </TabsContent>
        <TabsContent value="versions" className="p-6 mt-0">
          <VersionsTab packId={pack.id} versions={versions} />
        </TabsContent>
        <TabsContent value="documents" className="p-6 mt-0">
          <SourceDocsTab municipalityId={municipalityId} />
        </TabsContent>
        <TabsContent value="candidates" className="p-6 mt-0">
          <RuleCandidatesTab municipalityId={municipalityId} />
        </TabsContent>
        <TabsContent value="rules" className="p-6 mt-0">
          <RulesTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="rulesets" className="p-6 mt-0">
          <RuleSetsTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="zones" className="p-6 mt-0">
          <ZonesTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="templates" className="p-6 mt-0">
          <TemplatesTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="reviews" className="p-6 mt-0">
          <ReviewsTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="tests" className="p-6 mt-0">
          <TestsTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="releases" className="p-6 mt-0">
          <ReleasesTab packVersionId={activeVersionId} />
        </TabsContent>
        <TabsContent value="changelog" className="p-6 mt-0">
          <ChangeLogTab packVersionId={activeVersionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───── OVERVIEW ───── */
function PackOverviewTab({ packVersionId, municipalityId, versions }: { packVersionId: string; municipalityId: string; versions: any[] }) {
  const { data: rules } = useQuery({ queryKey: ["pack-rules-count", packVersionId], queryFn: async () => { if (!packVersionId) return []; const { data } = await supabase.from("rules").select("id").eq("pack_version_id", packVersionId); return data ?? []; }, enabled: !!packVersionId });
  const { data: ruleSets } = useQuery({ queryKey: ["pack-rulesets-count", packVersionId], queryFn: async () => { if (!packVersionId) return []; const { data } = await supabase.from("rule_sets").select("id").eq("pack_version_id", packVersionId); return data ?? []; }, enabled: !!packVersionId });
  const { data: reviews } = useQuery({ queryKey: ["pack-reviews-count", packVersionId], queryFn: async () => { if (!packVersionId) return []; const { data } = await supabase.from("pack_reviews").select("id, status").eq("pack_version_id", packVersionId); return data ?? []; }, enabled: !!packVersionId });
  const { data: tests } = useQuery({ queryKey: ["pack-tests-count", packVersionId], queryFn: async () => { if (!packVersionId) return []; const { data } = await supabase.from("pack_test_cases").select("id").eq("pack_version_id", packVersionId); return data ?? []; }, enabled: !!packVersionId });
  const { data: docs } = useQuery({ queryKey: ["pack-docs-count", municipalityId], queryFn: async () => { if (!municipalityId) return []; const { data } = await supabase.from("source_documents").select("id").eq("municipality_id", municipalityId); return data ?? []; }, enabled: !!municipalityId });
  const { data: candidates } = useQuery({ queryKey: ["pack-candidates-count", municipalityId], queryFn: async () => { if (!municipalityId) return []; const { data } = await supabase.from("rule_candidates").select("id").eq("municipality_id", municipalityId); return data ?? []; }, enabled: !!municipalityId });
  const { data: releases } = useQuery({ queryKey: ["pack-releases-count", packVersionId], queryFn: async () => { if (!packVersionId) return []; const { data } = await supabase.from("pack_releases").select("id").eq("pack_version_id", packVersionId); return data ?? []; }, enabled: !!packVersionId });

  const openReviews = reviews?.filter(r => r.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Versionen" value={versions.length} />
        <MiniStat label="Quelldokumente" value={docs?.length ?? 0} />
        <MiniStat label="Kandidaten" value={candidates?.length ?? 0} />
        <MiniStat label="Regeln" value={rules?.length ?? 0} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Regelsets" value={ruleSets?.length ?? 0} />
        <MiniStat label="Testfälle" value={tests?.length ?? 0} />
        <MiniStat label="Releases" value={releases?.length ?? 0} />
        <MiniStat label="Offene Reviews" value={openReviews} highlight={openReviews > 0} />
      </div>
      <div className="border border-border rounded-md bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] font-medium text-foreground">Regelpflege-Workflow</span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Quelldokumente erfassen → Rule Candidates ableiten → Regeln formalisieren → Regelsets bündeln → Zonen definieren → Tests schreiben → Review durchführen → Release veröffentlichen.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border rounded-md px-3 py-2.5 ${highlight ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
      <div className={`text-xl font-semibold ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

/* ───── VERSIONS ───── */
function VersionsTab({ packId, versions }: { packId: string; versions: any[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{versions.length} Versionen</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Neue Version
        </Button>
      </TabToolbar>
      {!versions.length ? <EmptyState icon={Layers} title="Keine Versionen" description="Erstellen Sie die erste Pack-Version." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Version</TableHead>
          <TableHead className={thClass}>Label</TableHead>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Gültig ab</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {versions.map((v) => (
            <TableRow key={v.id}>
              <TableCell className={`font-medium font-mono ${tdClass}`}>v{v.version_number}</TableCell>
              <TableCell className={tdMuted}>{v.version_label || "–"}</TableCell>
              <TableCell><StatusBadge status={v.status} /></TableCell>
              <TableCell className={tdMuted}>{v.effective_date ? format(new Date(v.effective_date), "dd.MM.yyyy") : "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(v.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <CreatePackVersionDialog open={createOpen} onOpenChange={setCreateOpen} packId={packId} />
    </>
  );
}

/* ───── SOURCE DOCS ───── */
function SourceDocsTab({ municipalityId }: { municipalityId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["pack-source-docs", municipalityId],
    queryFn: async () => {
      if (!municipalityId) return [];
      const { data, error } = await supabase.from("source_documents").select("*").eq("municipality_id", municipalityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!municipalityId,
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Quelldokumente</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)} disabled={!municipalityId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Quelldokument
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={FileText} title="Keine Quelldokumente" description="Erfassen Sie Satzungen und Verordnungen." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>URL</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((d) => (
            <TableRow key={d.id}>
              <TableCell className={`font-medium ${tdClass}`}>{d.name}</TableCell>
              <TableCell className={tdMuted}>{d.document_type || "–"}</TableCell>
              <TableCell className={`${tdMuted} font-mono text-[11px] max-w-xs truncate`}>{d.source_url || "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(d.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      {municipalityId && <CreateSourceDocumentDialog open={createOpen} onOpenChange={setCreateOpen} municipalityId={municipalityId} />}
    </>
  );
}

/* ───── RULE CANDIDATES ───── */
function RuleCandidatesTab({ municipalityId }: { municipalityId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawText, setRawText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pack-rule-candidates", municipalityId],
    queryFn: async () => {
      if (!municipalityId) return [];
      const { data, error } = await supabase.from("rule_candidates").select("*, source_documents(name)").eq("municipality_id", municipalityId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!municipalityId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("rule_candidates").insert({
        municipality_id: municipalityId,
        title: title.trim(),
        description: description.trim() || null,
        raw_text: rawText.trim() || null,
        created_by: user.user?.id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-rule-candidates", municipalityId] });
      toast.success("Regelkandidat erstellt");
      setCreateOpen(false);
      setTitle(""); setDescription(""); setRawText("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Regelkandidaten</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)} disabled={!municipalityId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Kandidat
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={AlertTriangle} title="Keine Rule Candidates" description="Leiten Sie Regelkandidaten aus Quelldokumenten ab." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Quelldokument</TableHead>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((rc) => (
            <TableRow key={rc.id}>
              <TableCell className={`font-medium ${tdClass}`}>{rc.title}</TableCell>
              <TableCell className={tdMuted}>{(rc.source_documents as any)?.name ?? "–"}</TableCell>
              <TableCell><StatusBadge status={rc.status} /></TableCell>
              <TableCell className={tdMuted}>{format(new Date(rc.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Neuen Regelkandidaten anlegen</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Titel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Stellplatzschlüssel Wohnen" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Beschreibung</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurzbeschreibung…" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Regeltext</Label>
              <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Originaltext aus dem Quelldokument…" className="text-[13px] min-h-[60px]" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="text-[13px]">Abbrechen</Button>
            <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="text-[13px]">
              {createMutation.isPending ? "Erstellt…" : "Kandidat erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───── RULES ───── */
function RulesTab({ packVersionId }: { packVersionId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pack-rules", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("rules").select("*, rule_candidates(title)").eq("pack_version_id", packVersionId).order("code");
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("rules").insert({
        pack_version_id: packVersionId,
        code: code.trim(),
        title: title.trim(),
        description: ruleDescription.trim() || null,
        category: category.trim() || null,
        created_by: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-rules", packVersionId] });
      queryClient.invalidateQueries({ queryKey: ["pack-rules-count", packVersionId] });
      toast.success("Regel erstellt");
      setCreateOpen(false);
      setCode(""); setTitle(""); setRuleDescription(""); setCategory("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  if (!packVersionId) return <EmptyState icon={Scale} title="Bitte erst eine Version auswählen" />;

  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Regeln</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Regel
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={Scale} title="Keine Regeln in dieser Version" /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Code</TableHead>
          <TableHead className={thClass}>Titel</TableHead>
          <TableHead className={thClass}>Kandidat</TableHead>
          <TableHead className={thClass}>Kategorie</TableHead>
          <TableHead className={thClass}>Typ</TableHead>
          <TableHead className={thClass}>Status</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell className={`font-mono font-medium ${tdClass}`}>{r.code}</TableCell>
              <TableCell className={tdClass}>{r.title}</TableCell>
              <TableCell className={tdMuted}>{(r.rule_candidates as any)?.title ?? "–"}</TableCell>
              <TableCell className={tdMuted}>{r.category || "–"}</TableCell>
              <TableCell className={tdMuted}>{r.rule_type || "–"}</TableCell>
              <TableCell><StatusBadge status={r.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Neue Regel anlegen</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="z. B. R-001" className="h-9 text-[13px] font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Kategorie</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z. B. Stellplatz" className="h-9 text-[13px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Titel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Regeltitel…" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Beschreibung</Label>
              <Textarea value={ruleDescription} onChange={(e) => setRuleDescription(e.target.value)} placeholder="Regelbeschreibung…" className="text-[13px] min-h-[60px]" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="text-[13px]">Abbrechen</Button>
            <Button size="sm" onClick={() => createMutation.mutate()} disabled={!code.trim() || !title.trim() || createMutation.isPending} className="text-[13px]">
              {createMutation.isPending ? "Erstellt…" : "Regel erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───── RULE SETS ───── */
function RuleSetsTab({ packVersionId }: { packVersionId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["pack-rule-sets", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("rule_sets").select("*, rule_set_rules(id)").eq("pack_version_id", packVersionId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Regelsets</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)} disabled={!packVersionId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Regelset
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={BookOpen} title="Keine Regelsets" description="Gruppieren Sie Regeln in Sets." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Kategorie</TableHead>
          <TableHead className={thClass}>Regeln</TableHead>
          <TableHead className={thClass}>Beschreibung</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((rs) => (
            <TableRow key={rs.id}>
              <TableCell className={`font-medium ${tdClass}`}>{rs.name}</TableCell>
              <TableCell className={tdMuted}>{rs.category || "–"}</TableCell>
              <TableCell className={tdMuted}>{Array.isArray(rs.rule_set_rules) ? rs.rule_set_rules.length : 0}</TableCell>
              <TableCell className={`${tdMuted} max-w-sm truncate`}>{rs.description || "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      {packVersionId && <CreateRuleSetDialog open={createOpen} onOpenChange={setCreateOpen} packVersionId={packVersionId} />}
    </>
  );
}

/* ───── ZONES ───── */
function ZonesTab({ packVersionId }: { packVersionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pack-zones", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("zone_definitions").select("*").eq("pack_version_id", packVersionId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Map} title="Keine Zonen definiert" />;
  return (
    <Table><TableHeader><TableRow>
      <TableHead className={thClass}>Name</TableHead>
      <TableHead className={thClass}>Typ</TableHead>
      <TableHead className={thClass}>Beschreibung</TableHead>
    </TableRow></TableHeader><TableBody>
      {data.map((z) => (
        <TableRow key={z.id}>
          <TableCell className={`font-medium ${tdClass}`}>{z.name}</TableCell>
          <TableCell className={tdMuted}>{z.zone_type || "–"}</TableCell>
          <TableCell className={`${tdMuted} max-w-md truncate`}>{z.description || "–"}</TableCell>
        </TableRow>
      ))}
    </TableBody></Table>
  );
}

/* ───── TEMPLATES ───── */
function TemplatesTab({ packVersionId }: { packVersionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pack-templates", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("content_templates").select("*").eq("pack_version_id", packVersionId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={LayoutTemplate} title="Keine Templates vorhanden" />;
  return (
    <Table><TableHeader><TableRow>
      <TableHead className={thClass}>Name</TableHead>
      <TableHead className={thClass}>Typ</TableHead>
      <TableHead className={thClass}>Erstellt</TableHead>
    </TableRow></TableHeader><TableBody>
      {data.map((t) => (
        <TableRow key={t.id}>
          <TableCell className={`font-medium ${tdClass}`}>{t.name}</TableCell>
          <TableCell className={tdMuted}>{t.template_type || "–"}</TableCell>
          <TableCell className={tdMuted}>{format(new Date(t.created_at), "dd.MM.yyyy")}</TableCell>
        </TableRow>
      ))}
    </TableBody></Table>
  );
}

/* ───── REVIEWS ───── */
function ReviewsTab({ packVersionId }: { packVersionId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["pack-reviews", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("pack_reviews").select("*").eq("pack_version_id", packVersionId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Prüfungen</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)} disabled={!packVersionId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Prüfung starten
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={CheckCircle} title="Keine Prüfungen" description="Starten Sie eine Prüfung für diese Version." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Status</TableHead>
          <TableHead className={thClass}>Anmerkungen</TableHead>
          <TableHead className={thClass}>Geprüft</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell><StatusBadge status={r.status} /></TableCell>
              <TableCell className={`${tdMuted} max-w-md truncate`}>{r.review_notes || "–"}</TableCell>
              <TableCell className={tdMuted}>{r.reviewed_at ? format(new Date(r.reviewed_at), "dd.MM.yyyy") : "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(r.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      {packVersionId && <CreateReviewDialog open={createOpen} onOpenChange={setCreateOpen} packVersionId={packVersionId} />}
    </>
  );
}

/* ───── TESTS ───── */
function TestsTab({ packVersionId }: { packVersionId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["pack-test-cases", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("pack_test_cases").select("*").eq("pack_version_id", packVersionId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Testfälle</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)} disabled={!packVersionId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Testfall
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={TestTube} title="Keine Testfälle" description="Definieren Sie Testfälle für diese Pack-Version." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Name</TableHead>
          <TableHead className={thClass}>Beschreibung</TableHead>
          <TableHead className={thClass}>Erstellt</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((t) => (
            <TableRow key={t.id}>
              <TableCell className={`font-medium ${tdClass}`}>{t.name}</TableCell>
              <TableCell className={`${tdMuted} max-w-md truncate`}>{t.description || "–"}</TableCell>
              <TableCell className={tdMuted}>{format(new Date(t.created_at), "dd.MM.yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      {packVersionId && <CreateTestCaseDialog open={createOpen} onOpenChange={setCreateOpen} packVersionId={packVersionId} />}
    </>
  );
}

/* ───── RELEASES ───── */
function ReleasesTab({ packVersionId }: { packVersionId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["pack-releases", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("pack_releases").select("*").eq("pack_version_id", packVersionId).order("released_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  return (
    <>
      <TabToolbar>
        <span className="text-[13px] font-medium">{data?.length ?? 0} Releases</span>
        <Button size="sm" variant="outline" className="h-8 text-[13px]" onClick={() => setCreateOpen(true)} disabled={!packVersionId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Release
        </Button>
      </TabToolbar>
      {isLoading ? <p className={tdMuted}>Lädt…</p> :
       !data?.length ? <EmptyState icon={Rocket} title="Keine Releases" description="Veröffentlichen Sie diese Pack-Version." /> : (
        <Table><TableHeader><TableRow>
          <TableHead className={thClass}>Release-Datum</TableHead>
          <TableHead className={thClass}>Notizen</TableHead>
        </TableRow></TableHeader><TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell className={`font-medium ${tdClass}`}>{format(new Date(r.released_at), "dd.MM.yyyy HH:mm")}</TableCell>
              <TableCell className={`${tdMuted} max-w-lg truncate`}>{r.release_notes || "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      )}
      {packVersionId && <CreateReleaseDialog open={createOpen} onOpenChange={setCreateOpen} packVersionId={packVersionId} />}
    </>
  );
}

/* ───── CHANGE LOG ───── */
function ChangeLogTab({ packVersionId }: { packVersionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pack-changelog", packVersionId],
    queryFn: async () => {
      if (!packVersionId) return [];
      const { data, error } = await supabase.from("pack_change_logs").select("*").eq("pack_version_id", packVersionId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!packVersionId,
  });
  if (isLoading) return <p className={tdMuted}>Lädt…</p>;
  if (!data?.length) return <EmptyState icon={Clock} title="Keine Änderungen protokolliert" />;
  return (
    <Table><TableHeader><TableRow>
      <TableHead className={thClass}>Aktion</TableHead>
      <TableHead className={thClass}>Entität</TableHead>
      <TableHead className={thClass}>Beschreibung</TableHead>
      <TableHead className={thClass}>Datum</TableHead>
    </TableRow></TableHeader><TableBody>
      {data.map((c) => (
        <TableRow key={c.id}>
          <TableCell className={`font-medium ${tdClass}`}>{c.action}</TableCell>
          <TableCell className={tdMuted}>{c.entity_type || "–"}</TableCell>
          <TableCell className={`${tdMuted} max-w-md truncate`}>{c.description || "–"}</TableCell>
          <TableCell className={tdMuted}>{format(new Date(c.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
        </TableRow>
      ))}
    </TableBody></Table>
  );
}
