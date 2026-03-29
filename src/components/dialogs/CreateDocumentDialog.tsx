import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const DOC_TYPES = [
  "Mobilitätskonzept",
  "Carsharing-Vertrag",
  "ÖPNV-Nachweis",
  "Lageplan",
  "Fahrradkonzept",
  "Betreibervertrag",
  "Baugenehmigung",
  "Gutachten",
  "Sonstiges",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function CreateDocumentDialog({ open, onOpenChange, projectId }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("Datei zu groß – max. 20 MB");
      return;
    }
    setFile(selected);
    if (!name.trim()) {
      setName(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Keine Datei ausgewählt");
      const { data: user } = await supabase.auth.getUser();
      const storagePath = `projects/${projectId}/${Date.now()}_${file.name}`;

      // Upload to Supabase Storage
      const { error: upErr } = await supabase.storage
        .from("project-attachments")
        .upload(storagePath, file);
      if (upErr) throw upErr;

      // Insert metadata into project_documents
      const { error } = await supabase.from("project_documents").insert({
        name: name.trim(),
        file_name: file.name,
        file_path: storagePath,
        file_size_bytes: file.size,
        file_type: file.type,
        document_type: documentType || null,
        project_id: projectId,
        uploaded_by: user.user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Dokument hochgeladen");
      onOpenChange(false);
      setName("");
      setDocumentType("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Dokument hochladen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          {/* File picker area */}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Datei *</Label>
            <div
              className="border border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-foreground">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatSize(file.size)}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-[12px] text-muted-foreground">Klicken um Datei auszuwählen</p>
                  <p className="text-[11px] text-muted-foreground">PDF, JPG, PNG, DOCX · max. 20 MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Dokumentname *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Stellplatznachweis v1" className="h-9 text-[13px]" />
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
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || !file || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Wird hochgeladen…" : "Dokument hochladen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
