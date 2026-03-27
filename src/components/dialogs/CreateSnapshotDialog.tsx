import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateSnapshotDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [versionLabel, setVersionLabel] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("submission_snapshots").insert({
        version_label: versionLabel.trim(),
        project_id: projectId,
        submitted_by: user.user?.id || null,
        submitted_at: new Date().toISOString(),
        snapshot_data: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-snapshots", projectId] });
      toast.success("Einreichung erstellt");
      onOpenChange(false);
      setVersionLabel("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Einreichung erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Versionsbezeichnung *</Label>
            <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="z. B. V1.0, Entwurf 2024-03" className="h-9 text-[13px]" />
          </div>
          <p className="text-[12px] text-muted-foreground">
            Ein Snapshot sichert den aktuellen Projektstand als unveränderliche Einreichung.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!versionLabel.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Einreichung erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
