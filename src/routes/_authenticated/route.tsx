import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles, signOutClean } from "@/lib/auth";
import { getRolesCached, getUserCached } from "@/lib/auth-cache";
import { AppShell } from "@/components/AppShell";
import {
  LayoutDashboard,
  ClipboardPlus,
  Wrench,
  ShieldCheck,
  Briefcase,
  Calendar,
  BarChart3,
  Bell,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const SHELL_TITLE: Record<string, string> = {
  admin: "Admin",
  accountant: "Accountant",
  mini_admin: "Mini Admin",
  engineer: "Engineer",
  client: "Client",
};

const AIAssistant = lazy(() =>
  import("@/components/AIAssistant").then((m) => ({ default: m.AIAssistant })),
);

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await getUserCached();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Load roles once here so requireRole and the layout reuse them.
    await getRolesCached(data.user.id);
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
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string | null; link: string | null; read_at: string | null }>>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const mountedRef = useRef(false);

  const loadNotifications = useCallback(async () => {
    const { data: userData } = await getUserCached();
    if (!userData.user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,link,read_at")
      .eq("user_id", userData.user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (mountedRef.current) {
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
  }, []);

  // Load once on mount, and again each time the dropdown is opened.
  useEffect(() => {
    mountedRef.current = true;
    loadNotifications();
    return () => {
      mountedRef.current = false;
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (notificationsOpen) loadNotifications();
  }, [notificationsOpen, loadNotifications]);

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
            ? [
                { to: "/engineer", label: "Engineer", icon: Wrench },
                { to: "/engineer/todos", label: "To Do List", icon: Calendar },
              ]
            : [
                { to: "/client", label: "My projects", icon: LayoutDashboard },
                { to: "/client/new", label: "New request", icon: ClipboardPlus },
              ];

  const content = loading ? (
    <div className="p-4 text-sm text-muted-foreground">Loading…</div>
  ) : (
    <Outlet />
  );

  const bell = (
    <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="tile-light press relative grid h-10 w-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
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
                <div className="text-sm text-muted-foreground">{notification.body}</div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mini-admin and accountant pages bring their own layout, so they are not wrapped again.
  if (isStandaloneSectionPage) {
    return (
      <div className="min-h-screen w-full bg-background">
        <main className="min-w-0">{content}</main>
        <Suspense fallback={null}>
          <AIAssistant />
        </Suspense>
      </div>
    );
  }

  return (
    <>
      <AppShell
        title={SHELL_TITLE[primaryRole] ?? "FusionPro"}
        links={links}
        onSignOut={() => signOutClean(navigate)}
        actions={bell}
      >
        {content}
      </AppShell>
      <Suspense fallback={null}>
        <AIAssistant />
      </Suspense>
    </>
  );
}
