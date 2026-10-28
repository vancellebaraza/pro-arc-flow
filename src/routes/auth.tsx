import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import hero640Avif from "@/assets/login/login-engineer-640.avif";
import hero640Webp from "@/assets/login/login-engineer-640.webp";
import hero800Avif from "@/assets/login/login-engineer-800.avif";
import hero800Webp from "@/assets/login/login-engineer-800.webp";
import hero800Jpg from "@/assets/login/login-engineer-800.jpg";
import hero1512Avif from "@/assets/login/login-engineer-1512.avif";
import hero1512Webp from "@/assets/login/login-engineer-1512.webp";
import { ensureFixedAccounts } from "@/lib/setup.functions";
import WhatsAppButton from "@/components/WhatsAppButton2";
import { getRolesCached, getUserCached } from "@/lib/auth-cache";

async function redirectToRoleHome(navigate: ReturnType<typeof useNavigate>) {
  const { data: userData } = await getUserCached();
  if (!userData.user) {
    navigate({ to: "/auth", replace: true });
    return;
  }

  const roles = (await getRolesCached(userData.user.id)) ?? [];
  const primaryRole = roles.includes("admin")
    ? "admin"
    : roles.includes("accountant")
      ? "accountant"
      : roles.includes("mini_admin")
        ? "mini_admin"
        : roles.includes("engineer")
          ? "engineer"
          : roles.includes("project_view_admin")
            ? "project_view_admin"
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
            : primaryRole === "project_view_admin"
              ? "/project-viewer"
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
      const msg = err instanceof Error && err.message ? err.message : String(err);
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
      const msg = err instanceof Error && err.message ? err.message : String(err);
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

  const inputCls = "h-14 rounded-full bg-card px-6 text-base md:text-base";
  const passwordCls = `${inputCls} pr-14`;
  const labelCls = "mb-2 block text-sm font-semibold";
  const heroSizes = "max(50vw, 188vh)";

  return (
    <div className="min-h-screen bg-muted md:grid md:grid-cols-2">
      <div className="relative h-52 overflow-hidden bg-secondary md:sticky md:top-0 md:h-screen">
        <picture>
          <source
            media="(min-width: 768px)"
            type="image/avif"
            srcSet={`${hero800Avif} 800w, ${hero1512Avif} 1512w`}
            sizes={heroSizes}
          />
          <source
            media="(min-width: 768px)"
            type="image/webp"
            srcSet={`${hero800Webp} 800w, ${hero1512Webp} 1512w`}
            sizes={heroSizes}
          />
          <source media="(max-width: 767px)" type="image/avif" srcSet={hero640Avif} />
          <source media="(max-width: 767px)" type="image/webp" srcSet={hero640Webp} />
          <img
            src={hero800Jpg}
            width={1512}
            height={803}
            alt="A FusionPro engineer in a hard hat and company overalls"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[12%_0%] md:object-[14%_30%] lg:object-[10%_30%]"
          />
        </picture>
        <Button
          asChild
          variant="dark"
          className="absolute left-3 top-3 z-10 h-9 px-4 text-xs md:left-6 md:top-6 md:h-11 md:px-5 md:text-sm"
        >
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <p className="absolute bottom-6 left-6 z-10 hidden max-w-sm rounded-3xl bg-[var(--ink)]/90 px-5 py-3 text-sm font-medium leading-snug text-white backdrop-blur md:block">
          Your trusted partner for repairs, renovations, and property improvement.
        </p>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-6 md:min-h-screen md:p-8">
        <div className="relative z-10 -mt-6 w-full max-w-[560px] rounded-[2rem] border border-border/60 bg-background p-8 shadow-[var(--shadow-card)] md:mt-0 md:p-10">
          <Logo className="h-20 w-auto" />
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsContent value="signin" className="mt-0">
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight">
                Welcome back
              </h1>
              <p className="mt-2 text-muted-foreground">
                Submit requests, run inspections, build quotations, and track every project from one
                place.
              </p>
              <form onSubmit={signIn} className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="email" className={labelCls}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="password" className={labelCls}>
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    className={passwordCls}
                  />
                  <button
                    type="button"
                    aria-expanded={resetMode}
                    onClick={() => {
                      setResetMode((v) => !v);
                      setResetSent(false);
                    }}
                    className="ml-auto mt-3 block rounded-full px-2 py-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="dark"
                  disabled={loading}
                  className="h-14 w-full text-base"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Sign in
                </Button>
              </form>

              {resetMode && (
                <div className="mt-6 border-t pt-6">
                  {resetSent ? (
                    <p className="text-sm text-muted-foreground">
                      If an account exists for that email, a reset link is on its way. Check your
                      inbox.
                    </p>
                  ) : (
                    <form onSubmit={sendResetLink} className="space-y-4">
                      <div>
                        <Label htmlFor="reset_email" className={labelCls}>
                          Email
                        </Label>
                        <Input
                          id="reset_email"
                          name="reset_email"
                          type="email"
                          autoComplete="email"
                          required
                          className={inputCls}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="h-14 w-full text-base"
                        variant="outline"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Send reset
                        link
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight">
                Create account
              </h1>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                New accounts are automatically set up as <strong>client portals</strong>. Engineer
                and admin access is reserved.
              </p>
              <form onSubmit={signUp} className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="full_name" className={labelCls}>
                    Full name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    autoComplete="name"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className={labelCls}>
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="email2" className={labelCls}>
                    Email
                  </Label>
                  <Input
                    id="email2"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="password2" className={labelCls}>
                    Password
                  </Label>
                  <PasswordInput
                    id="password2"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className={passwordCls}
                  />
                </div>
                <Button
                  type="submit"
                  variant="dark"
                  disabled={loading}
                  className="h-14 w-full text-base"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create client
                  account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div
            className="my-6 flex items-center gap-4 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="rounded-full px-1 font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
      <WhatsAppButton />
    </div>
  );
}
