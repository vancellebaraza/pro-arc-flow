import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — FusionPro" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        toast.error("This reset link is invalid or has expired.");
        navigate({ to: "/auth", replace: true });
      }
    });
  }, [navigate]);

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.auth.updateUser({ password });
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
    } catch (err: unknown) {
      console.error("updateUser error:", err);
      const msg = err instanceof Error && err.message ? err.message : String(err);
      toast.error(`Could not update password: ${msg}`);
      return;
    } finally {
      setLoading(false);
    }
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/dashboard", replace: true });
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="h-8 w-auto" />
        </div>
        <h1 className="text-xl font-semibold text-center mb-6">Set a new password</h1>
        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <PasswordInput id="password" name="password" required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput id="confirm" name="confirm" required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
