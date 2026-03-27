import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  packId: string;
}

export function CreatePackVersionDialog({ open, onOpenChange, packId }: Props) {
  const queryClient = useQueryClient();
  const [versionLabel, setVersionLabel] = useState("");
  const [changelog, setChangelog] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");

  const { data: existingVersions } = useQuery({
    queryKey: ["pack-versions", packId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jurisdiction_pack_versions").select("version_number").eq("pack_id", packId).order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const nextVersionNumber = (existingVersions?.[0]?.version_number ?? 0) + 1;

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("jurisdiction_pack_versions").insert({
        pack_id: packId,
        version_number: nextVersionNumber,
        version_label: versionLabel.trim() || `v${nextVersionNumber}`,
        changelog: changelog.trim() || null,
        effective_date: effectiveDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-versions", packId] });
      queryClient.invalidateQueries({ queryKey: ["pack-detail", packId] });
      toast.success("Pack-Version erstellt");
      onOpenChange(false);
      setVersionLabel("");
      setChangelog("");
      setEffectiveDate("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Pack-Version anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Versionsnummer</Label>
            <p className="text-[13px] font-mono text-muted-foreground">v{nextVersionNumber}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Versionsbezeichnung</Label>
            <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder={`z. B. v${nextVersionNumber}.0`} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Gültig ab</Label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Änderungsprotokoll</Label>
            <Textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Änderungen in dieser Version…" className="text-[13px] min-h-[60px]" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Version erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
