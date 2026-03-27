import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateScenarioDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conceptVersionId, setConceptVersionId] = useState("");
  const [isBaseline, setIsBaseline] = useState(false);

  const { data: concepts } = useQuery({
    queryKey: ["project-concepts-with-versions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobility_concepts")
        .select("id, name, concept_versions(id, version_number, status)")
        .eq("project_id", projectId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const allVersions = concepts?.flatMap((c) => {
    const versions = Array.isArray(c.concept_versions) ? c.concept_versions : [];
    return versions.map((v) => ({ ...v, conceptName: c.name }));
  }) ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scenarios").insert({
        name: name.trim(),
        description: description.trim() || null,
        concept_version_id: conceptVersionId,
        project_id: projectId,
        is_baseline: isBaseline,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-scenarios", projectId] });
      toast.success("Szenario erstellt");
      onOpenChange(false);
      setName("");
      setDescription("");
      setConceptVersionId("");
      setIsBaseline(false);
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neues Szenario anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Variante A – mit Carsharing" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Konzeptversion *</Label>
            <Select value={conceptVersionId} onValueChange={setConceptVersionId}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Version wählen…" />
              </SelectTrigger>
              <SelectContent>
                {allVersions.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-[13px]">
                    {v.conceptName} – v{v.version_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isBaseline} onCheckedChange={setIsBaseline} />
            <Label className="text-[13px]">Baseline-Szenario</Label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || !conceptVersionId || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Szenario erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
