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

const CATEGORIES = [
  "Mobility Management",
  "Sharing",
  "ÖPNV",
  "Radverkehr",
  "Fußverkehr",
  "Stellplatzgestaltung",
  "Ladeinfrastruktur",
  "Sonstiges",
];

export function CreateMeasureDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [reductionValue, setReductionValue] = useState("");
  const [reductionUnit, setReductionUnit] = useState("Stellplätze");

  const { data: scenarios } = useQuery({
    queryKey: ["project-scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("id, name, is_baseline").eq("project_id", projectId).order("is_baseline", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("measures").insert({
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
        scenario_id: scenarioId,
        project_id: projectId,
        reduction_value: reductionValue ? parseFloat(reductionValue) : null,
        reduction_unit: reductionUnit || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-measures", projectId] });
      toast.success("Maßnahme erstellt");
      onOpenChange(false);
      setName(""); setDescription(""); setCategory(""); setScenarioId(""); setReductionValue("");
    },
    onError: (err: any) => {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Maßnahme anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Carsharing-Angebot" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Szenario *</Label>
            <Select value={scenarioId} onValueChange={setScenarioId}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Szenario wählen…" />
              </SelectTrigger>
              <SelectContent>
                {scenarios?.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-[13px]">
                    {s.name} {s.is_baseline ? "(Baseline)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Kategorie wählen…" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Reduktionswert</Label>
              <Input value={reductionValue} onChange={(e) => setReductionValue(e.target.value)} type="number" placeholder="z. B. 5" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Einheit</Label>
              <Input value={reductionUnit} onChange={(e) => setReductionUnit(e.target.value)} placeholder="Stellplätze" className="h-9 text-[13px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details zur Maßnahme…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || !scenarioId || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Maßnahme erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
