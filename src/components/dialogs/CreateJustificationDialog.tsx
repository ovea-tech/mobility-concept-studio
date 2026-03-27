import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const TYPES = ["Fachliche Begründung", "Rechtliche Begründung", "Nachweis", "Gutachten", "Sonstige"];

export function CreateJustificationDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [justificationType, setJustificationType] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("justifications").insert({
        title: title.trim(),
        content: content.trim() || null,
        justification_type: justificationType || null,
        project_id: projectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-justifications", projectId] });
      toast.success("Begründung erstellt");
      onOpenChange(false);
      setTitle(""); setContent(""); setJustificationType("");
    },
    onError: (err: any) => {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Begründung anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Nachweis ÖPNV-Anbindung" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Typ</Label>
            <Select value={justificationType} onValueChange={setJustificationType}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Typ wählen…" /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Inhalt</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Begründungstext…" className="text-[13px] min-h-[100px]" rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Begründung erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
