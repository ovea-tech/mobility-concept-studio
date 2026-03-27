import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packVersionId: string;
}

export function CreateReviewDialog({ open, onOpenChange, packVersionId }: Props) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Nicht angemeldet");
      const { error } = await supabase.from("pack_reviews").insert({
        pack_version_id: packVersionId,
        reviewer_id: user.user.id,
        review_notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-reviews"] });
      toast.success("Review erstellt");
      onOpenChange(false);
      setNotes("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Prüfung anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Anmerkungen</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Prüfnotizen…" className="text-[13px] min-h-[80px]" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Prüfung starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
