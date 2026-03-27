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
  const [workspaceId, setWorkspaceId] = useState("");
  const [packVersionId, setPackVersionId] = useState("");

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workspaces").select("id, name").order("name");
      if (error) throw error;
      return data;
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
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("projects").insert({
        name: name.trim(),
        description: description.trim() || null,
        workspace_id: workspaceId,
        jurisdiction_pack_version_id: packVersionId,
        created_by: session.session?.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projekt erstellt");
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
    setWorkspaceId("");
    setPackVersionId("");
  };

  const canSubmit = name.trim().length > 0 && workspaceId && packVersionId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div className="space-y-1.5">
            <Label className="text-[13px]">Arbeitsbereich *</Label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Arbeitsbereich wählen…" />
              </SelectTrigger>
              <SelectContent>
                {workspaces?.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="text-[13px]">{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">
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
