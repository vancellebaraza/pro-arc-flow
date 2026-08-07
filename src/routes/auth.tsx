import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ensureFixedAccounts } from "@/lib/setup.functions";

async function redirectToRoleHome(navigate: ReturnType<typeof useNavigate>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    navigate({ to: "/auth", replace: true });
    return;
  }

  const { data: rolesData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const roles = (rolesData ?? []).map((role) => role.role as string);
  const primaryRole = roles.includes("admin")
    ? "admin"
    : roles.includes("accountant")
      ? "accountant"
      : roles.includes("mini_admin")
        ? "mini_admin"
        : roles.includes("engineer")
          ? "engineer"
          : "client";

  const destination =
    primaryRole === "admin"
      ? "/admin"
      : primaryRole === "accountant"
        ? "/accountant"
        : primaryRole === "mini_admin"
          ? "/mini-admin/Dashboard"
          : primaryRole === "engineer"
            ? "/engineer"
            : "/client";

  navigate({ to: destination, replace: true });
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — FusionPro" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const provision = useServerFn(ensureFixedAccounts);

  useEffect(() => {
    // Ensure fixed admin/engineer accounts exist (idempotent)
    provision({ data: undefined }).catch(() => {});
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void redirectToRoleHome(navigate);
      }
    });
  }, [navigate, provision]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      });
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
    } catch (err: unknown) {
      // Network-level failures (e.g. failed fetch) can throw instead of returning an error
      // Provide a clearer message to the user.
      // eslint-disable-next-line no-console
      console.error("signIn error:", err);
      const msg = (err instanceof Error && err.message) ? err.message : String(err);
      toast.error(`Sign-in failed: ${msg}`);
      return;
    } finally {
      setLoading(false);
    }
    toast.success("Welcome back");
    await redirectToRoleHome(navigate);
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await supabase.auth.signUp({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: String(fd.get("full_name") || ""),
            phone: String(fd.get("phone") || ""),
          },
        },
      });
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
    } catch (err: unknown) {
      // Handle network/fetch errors
      // eslint-disable-next-line no-console
      console.error("signUp error:", err);
      const msg = (err instanceof Error && err.message) ? err.message : String(err);
      toast.error(`Sign-up failed: ${msg}`);
      return;
    } finally {
      setLoading(false);
    }
    toast.success("Account created. You're signed in.");
    await redirectToRoleHome(navigate);
  }

  async function sendResetLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("reset_email"));
    setLoading(true);
    try {
      const res = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      setResetSent(true);
    } catch (err: unknown) {
      console.error("resetPasswordForEmail error:", err);
      const msg = err instanceof Error && err.message ? err.message : String(err);
      toast.error(`Could not send reset email: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 surface border-r">
        <Link to="/">
          <Logo className="h-29 w-auto" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight max-w-md leading-tight">
            Fusion Pro Limited property operations, unified.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-md">
            Submit requests, run inspections, build quotations, and track every project from one
            place.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fusion Pro Limited
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-6">
            <Logo className="h-29 w-auto" />
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" name="password" required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Sign in
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode((v) => !v);
                    setResetSent(false);
                  }}
                  className="block text-xs text-muted-foreground hover:underline"
                >
                  Forgot password?
                </button>
              </form>

              {resetMode && (
                <div className="mt-4 border-t pt-4">
                  {resetSent ? (
                    <p className="text-sm text-muted-foreground">
                      If an account exists for that email, a reset link is on its way. Check your
                      inbox.
                    </p>
                  ) : (
                    <form onSubmit={sendResetLink} className="space-y-3">
                      <div>
                        <Label htmlFor="reset_email">Email</Label>
                        <Input id="reset_email" name="reset_email" type="email" required />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full" variant="outline">
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Send reset
                        link
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="signup">
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                New accounts are automatically set up as <strong>client portals</strong>. Engineer
                and admin access is reserved.
              </p>
              <form onSubmit={signUp} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <PasswordInput id="password2" name="password" required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create client
                  account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-xs text-muted-foreground text-center">
            <Link to="/" className="hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
