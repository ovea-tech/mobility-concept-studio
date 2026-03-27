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
}

export function CreateMunicipalityDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [municipalCode, setMunicipalCode] = useState("");
  const [population, setPopulation] = useState("");
  const [areaKm2, setAreaKm2] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("municipalities").insert({
        name: name.trim(),
        state: state.trim(),
        municipal_code: municipalCode.trim() || null,
        population: population ? parseInt(population) : null,
        area_km2: areaKm2 ? parseFloat(areaKm2) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipalities"] });
      toast.success("Kommune erstellt");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    },
  });

  const resetForm = () => {
    setName(""); setState(""); setMunicipalCode(""); setPopulation(""); setAreaKm2("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Neue Kommune anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Name *" value={name} onChange={setName} placeholder="z. B. München" />
          <Field label="Bundesland *" value={state} onChange={setState} placeholder="z. B. Bayern" />
          <Field label="Gemeindeschlüssel" value={municipalCode} onChange={setMunicipalCode} placeholder="z. B. 09162000" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Einwohner" value={population} onChange={setPopulation} placeholder="z. B. 1500000" type="number" />
            <Field label="Fläche (km²)" value={areaKm2} onChange={setAreaKm2} placeholder="z. B. 310.7" type="number" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-[13px]">Abbrechen</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || !state.trim() || mutation.isPending} className="text-[13px]">
            {mutation.isPending ? "Erstellt…" : "Kommune erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} className="h-9 text-[13px]" />
    </div>
  );
}
