import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  projectId: string;
}

export function CreateAssumptionDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [confidence, setConfidence] = useState("");
  const [source, setSource] = useState("");

  const { data: scenarios } = useQuery({
    queryKey: ["project-scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("id, name").eq("project_id", projectId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assumptions").insert({
        title: title.trim(),
        description: description.trim() || null,
        scenario_id: scenarioId,
        project_id: projectId,
        confidence: confidence || null,
        source: source.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assumptions", projectId] });
      toast.success("Annahme erstellt");
      onOpenChange(false);
      setTitle(""); setDescription(""); setScenarioId(""); setConfidence(""); setSource("");
    },
    onError: (err: any) => {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Annahme anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Modal Split Annahme" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Szenario *</Label>
            <Select value={scenarioId} onValueChange={setScenarioId}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Szenario wählen…" /></SelectTrigger>
              <SelectContent>
                {scenarios?.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-[13px]">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Konfidenz</Label>
            <Select value={confidence} onValueChange={setConfidence}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Wählen…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-[13px]">Hoch</SelectItem>
                <SelectItem value="medium" className="text-[13px]">Mittel</SelectItem>
                <SelectItem value="low" className="text-[13px]">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Quelle</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="z. B. SrV 2018" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!title.trim() || !scenarioId || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Annahme erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
