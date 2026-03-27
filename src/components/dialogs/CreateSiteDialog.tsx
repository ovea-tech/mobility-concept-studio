import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateSiteDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [cadastralRef, setCadastralRef] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_sites").insert({
        name: name.trim(),
        address: address.trim() || null,
        area_sqm: areaSqm ? parseFloat(areaSqm) : null,
        cadastral_ref: cadastralRef.trim() || null,
        project_id: projectId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-sites", projectId] });
      toast.success("Standort erstellt");
      onOpenChange(false);
      setName(""); setAddress(""); setAreaSqm(""); setCadastralRef("");
    },
    onError: (err: any) => {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neuen Standort anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Baufeld A" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="z. B. Musterstraße 1, 80331 München" className="h-9 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Fläche (m²)</Label>
              <Input value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} type="number" placeholder="z. B. 5000" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Flurstück</Label>
              <Input value={cadastralRef} onChange={(e) => setCadastralRef(e.target.value)} placeholder="z. B. 1234/5" className="h-9 text-[13px]" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Standort erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
