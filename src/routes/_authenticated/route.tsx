import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles, signOutClean } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  ClipboardPlus,
  Wrench,
  ShieldCheck,
  Menu,
  Briefcase,
  Calendar,
  BarChart3,
  Bell,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIAssistant } from "@/components/AIAssistant";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { primaryRole, loading } = useMyRoles();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMiniAdminPage = pathname.startsWith("/mini-admin");
  const isAccountantPage = pathname.startsWith("/accountant");
  const isStandaloneSectionPage = isMiniAdminPage || isAccountantPage;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string | null; link: string | null; read_at: string | null }>>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !mounted) return;
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,link,read_at")
        .eq("user_id", userData.user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (mounted) {
        setNotifications(
          (data ?? []) as Array<{
            id: string;
            title: string;
            body: string | null;
            link: string | null;
            read_at: string | null;
          }>,
        );
      }
    }
    if (notificationsOpen || pathname) {
      loadNotifications();
    }
    return () => {
      mounted = false;
    };
  }, [notificationsOpen, pathname]);

  async function handleNotificationClick(notificationId: string, link: string | null) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    if (link) {
      navigate({ to: link as string });
    }
    setNotificationsOpen(false);
  }

  const links =
    primaryRole === "admin"
      ? [
          { to: "/admin", label: "Admin", icon: ShieldCheck },
          { to: "/accountant", label: "Accountant", icon: ShieldCheck },
          { to: "/admin/analysis", label: "Analysis", icon: BarChart3 },
          { to: "/admin/vendors", label: "Vendor Management", icon: Briefcase },
          { to: "/admin/todos", label: "Staff To Do", icon: Calendar },
          { to: "/engineer", label: "Engineer view", icon: Wrench },
          { to: "/client", label: "Client view", icon: ClipboardPlus },
        ]
      : primaryRole === "accountant"
        ? [{ to: "/accountant", label: "Accountant", icon: ShieldCheck }]
        : primaryRole === "mini_admin"
          ? [{ to: "/mini-admin", label: "Mini Admin", icon: ShieldCheck }]
          : primaryRole === "engineer"
            ? [{ to: "/engineer", label: "Engineer", icon: Wrench }]
            : [
                { to: "/client", label: "My projects", icon: LayoutDashboard },
                { to: "/client/new", label: "New request", icon: ClipboardPlus },
              ];

  return (
    <div className="min-h-screen flex w-full bg-background">
{!isStandaloneSectionPage && (
  <aside className="hidden md:flex w-60 shrink-0 flex-col border-r surface">
    <div className="h-16 flex items-center px-5 border-b">
      <Link to="/">
        <Logo className="h-7 w-auto" />
      </Link>
    </div>

    <nav className="flex-1 p-3 space-y-1">
      {links.map((l) => {
        const active = pathname === l.to || pathname.startsWith(l.to + "/");

        return (
          <Link
            key={l.to}
            to={l.to}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>

    <div className="p-3 border-t">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => signOutClean(navigate)}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </div>
  </aside>
)}

      <div className="flex-1 flex flex-col min-w-0">
        {!isStandaloneSectionPage && (<header className="md:hidden h-14 border-b flex items-center justify-between px-4">
          <Logo className="h-6 w-auto" />
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setMobileNavOpen((v) => !v)}>
              <Menu className="h-5 w-5" />
            </Button>
            {mobileNavOpen && (
              <div className="absolute right-0 top-12 z-40 w-56 rounded-md border bg-popover shadow-md p-2">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    signOutClean(navigate);
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>)}
        {!isStandaloneSectionPage && (
          <header className="hidden md:flex h-16 items-center justify-end border-b px-4">
            <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <button className="relative rounded-full p-2 text-muted-foreground hover:bg-accent">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {notifications.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No unread notifications.</div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onSelect={() => handleNotificationClick(notification.id, notification.link)}
                      className="flex cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-2"
                    >
                      <div className="text-sm font-medium">{notification.title}</div>
                      {notification.body && (
                        <div className="text-xs text-muted-foreground">{notification.body}</div>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
        )}
        <main className="flex-1 min-w-0">
          {loading ? <div className="p-8 text-sm text-muted-foreground">Loading…</div> : <Outlet />}
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
