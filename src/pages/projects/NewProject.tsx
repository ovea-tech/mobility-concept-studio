import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [packVersionId, setPackVersionId] = useState("");

  const { data: userWorkspace } = useQuery({
    queryKey: ["user-workspace"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("memberships")
        .select("organization_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("organization_id", data.organization_id)
        .limit(1)
        .maybeSingle();
      return ws;
    },
  });

  const { data: packVersions } = useQuery({
    queryKey: ["pack-versions-released"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jurisdiction_pack_versions")
        .select("id, version_label, version_number, jurisdiction_packs(name)")
        .eq("status", "released")
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userWorkspace?.id) throw new Error("Kein Arbeitsbereich gefunden.");
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("projects").insert({
        name: name.trim(),
        description: description.trim() || null,
        workspace_id: userWorkspace.id,
        jurisdiction_pack_version_id: packVersionId,
        created_by: session?.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projekt wurde angelegt");
      navigate(`/projects/${data.id}`);
    },
    onError: (err: any) => {
      toast.error("Fehler: " + (err.message || "Unbekannter Fehler"));
    },
  });

  const canSubmit = name.trim().length > 0 && !!packVersionId && !!userWorkspace?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="text-[13px] gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Zurück
        </Button>
      </div>
      <PageHeader title="Neues Projekt anlegen" />
      <Card>
        <CardContent className="pt-6 space-y-5 max-w-lg">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Projektname *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Wohnquartier Südstadt" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Projektbeschreibung…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
          {userWorkspace && (
            <div className="space-y-1.5">
              <Label className="text-[13px] text-muted-foreground">Arbeitsbereich</Label>
              <p className="text-[13px] text-foreground">{userWorkspace.name}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Regelpaket-Version *</Label>
            <Select value={packVersionId} onValueChange={setPackVersionId}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Pack-Version wählen…" />
              </SelectTrigger>
              <SelectContent>
                {packVersions?.map((pv) => {
                  const packName = (pv.jurisdiction_packs as any)?.name ?? "";
                  return (
                    <SelectItem key={pv.id} value={pv.id} className="text-[13px]">
                      {packName} – {pv.version_label || `v${pv.version_number}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/projects")} className="text-[13px]">
              Abbrechen
            </Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending} className="text-[13px]">
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {mutation.isPending ? "Erstellt…" : "Projekt erstellen"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
