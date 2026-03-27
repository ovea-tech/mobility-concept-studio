import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateConceptVersionDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [conceptId, setConceptId] = useState("");

  const { data: concepts } = useQuery({
    queryKey: ["project-concepts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mobility_concepts").select("id, name, concept_versions(version_number)").eq("project_id", projectId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const concept = concepts?.find((c) => c.id === conceptId);
      const versions = Array.isArray(concept?.concept_versions) ? concept.concept_versions : [];
      const nextVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version_number)) + 1 : 1;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("concept_versions").insert({
        concept_id: conceptId,
        version_number: nextVersion,
        created_by: user.user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-concepts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-concepts-with-versions", projectId] });
      toast.success("Konzeptversion erstellt");
      onOpenChange(false);
      setConceptId("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Konzeptversion anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Konzept *</Label>
            <Select value={conceptId} onValueChange={setConceptId}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Konzept wählen…" />
              </SelectTrigger>
              <SelectContent>
                {concepts?.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[13px]">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Eine neue Version wird automatisch als Entwurf angelegt.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!conceptId || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Version erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
