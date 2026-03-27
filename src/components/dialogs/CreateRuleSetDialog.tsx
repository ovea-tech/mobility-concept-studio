import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packVersionId: string;
}

export function CreateRuleSetDialog({ open, onOpenChange, packVersionId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rule_sets").insert({
        name: name.trim(),
        category: category.trim() || null,
        description: description.trim() || null,
        pack_version_id: packVersionId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-rule-sets"] });
      toast.success("Regelset erstellt");
      onOpenChange(false);
      setName("");
      setCategory("");
      setDescription("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neues Regelset anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Wohnnutzung Kerngebiet" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Kategorie</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z. B. Stellplatz" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Regelset erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
