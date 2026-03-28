import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort."
          : authError.message
      );
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
            neotopia
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Mobility Compliance Authoring
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-6">
          <h2 className="text-[15px] font-medium text-foreground mb-4">
            Anmelden
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">
                E-Mail-Adresse
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firma.de"
                className="h-9 text-[13px]"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px]">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-[13px]"
                required
              />
            </div>

            {error && (
              <p className="text-[12px] text-destructive leading-relaxed">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-9 text-[13px]"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? "Wird angemeldet…" : "Anmelden"}
            </Button>
          </form>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          © {new Date().getFullYear()} neotopia GmbH
        </p>
      </div>
    </div>
  );
}
