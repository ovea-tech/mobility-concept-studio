import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User } from "lucide-react";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (profile) setFullName(profile.full_name || "");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profil gespeichert");
    },
    onError: (err: any) => toast.error("Fehler: " + (err.message || "Unbekannt")),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-lg space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-[16px] font-semibold text-foreground">Profil bearbeiten</h1>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[13px]">E-Mail</Label>
          <Input value={profile?.email || ""} readOnly disabled className="h-9 text-[13px] bg-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px]">Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Vor- und Nachname" className="h-9 text-[13px]" />
        </div>
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="text-[13px]">
          {mutation.isPending ? "Speichert…" : "Profil speichern"}
        </Button>
      </div>
    </div>
  );
}
