import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [packVersionId, setPackVersionId] = useState("");

  // Auto-resolve workspace from user's membership
  const { data: userWorkspace } = useQuery({
    queryKey: ["user-workspace"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("organization_id, organizations(id, name)")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      const orgId = data.organization_id;
      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("organization_id", orgId)
        .limit(1)
        .maybeSingle();
      if (wsErr) return null;
      return ws;
    },
    enabled: open,
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
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userWorkspace?.id) throw new Error("Kein Arbeitsbereich gefunden.");
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("projects").insert({
        name: name.trim(),
        description: description.trim() || null,
        workspace_id: userWorkspace.id,
        jurisdiction_pack_version_id: packVersionId,
        created_by: session.session?.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projekt wurde angelegt");
      onOpenChange(false);
      resetForm();
      navigate(`/projects/${data.id}`);
    },
    onError: (err: any) => {
      toast.error("Fehler beim Erstellen: " + (err.message || "Unbekannter Fehler"));
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setPackVersionId("");
  };

  const canSubmit = name.trim().length > 0 && packVersionId && !!userWorkspace?.id;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neues Projekt anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Projektname *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Wohnquartier Südstadt"
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Projektbeschreibung…"
              className="text-[13px] min-h-[60px]"
              rows={2}
            />
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
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); onOpenChange(false); }} className="text-[13px]">
            Abbrechen
          </Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Projekt erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
