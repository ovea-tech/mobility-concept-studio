import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipalityId: string;
}

const DOC_TYPES = [
  "Stellplatzsatzung",
  "Bebauungsplan",
  "Mobilitätsleitlinie",
  "Verordnung",
  "Sonstiges",
];

export function CreateSourceDocumentDialog({ open, onOpenChange, municipalityId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("source_documents").insert({
        name: name.trim(),
        document_type: documentType || null,
        source_url: sourceUrl.trim() || null,
        municipality_id: municipalityId,
        uploaded_by: user.user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-source-docs"] });
      toast.success("Quelldokument erstellt");
      onOpenChange(false);
      setName("");
      setDocumentType("");
      setSourceUrl("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neues Quelldokument erfassen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Stellplatzsatzung München 2023" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Dokumenttyp</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Typ wählen…" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Quell-URL</Label>
            <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="h-9 text-[13px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Dokument erfassen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
