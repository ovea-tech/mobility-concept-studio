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
  projectId: string;
}

const DOC_TYPES = [
  "Mobilitätskonzept",
  "Stellplatznachweis",
  "Gutachten",
  "Bescheid",
  "Vereinbarung",
  "Nachweis",
  "Sonstiges",
];

export function CreateDocumentDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [documentType, setDocumentType] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("project_documents").insert({
        name: name.trim(),
        file_name: fileName.trim() || name.trim(),
        file_path: `projects/${projectId}/${fileName.trim() || name.trim()}`,
        document_type: documentType || null,
        project_id: projectId,
        uploaded_by: user.user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Dokument erfasst");
      onOpenChange(false);
      setName("");
      setFileName("");
      setDocumentType("");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Projektdokument erfassen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Dokumentname *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Stellplatznachweis v1" className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Dateiname</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="z. B. nachweis_v1.pdf" className="h-9 text-[13px]" />
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
