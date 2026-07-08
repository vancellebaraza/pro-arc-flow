

import {
  Outlet,
  Link,
  createFileRoute,
  redirect,
  useRouterState,
  useNavigate
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  LogOut
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/mini-admin")({
  component: MiniAdminLayout,
  beforeLoad: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw redirect({ to: "/auth" });

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    if (rolesError) throw redirect({ to: "/dashboard" });
    const hasAccess = (rolesData ?? []).some(
      (role) => role.role === "mini_admin" || role.role === "admin",
    );
    if (!hasAccess) throw redirect({ to: "/mini-admin/Dashboard" });

    return { user: userData.user };
  },
});

function MiniAdminLayout() {
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

   async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({
      to: "/auth",
      replace: true,
    });
  }
  const links = [
  {
    to: "/mini-admin/Dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/mini-admin/Engineer",
    label: "Engineer",
    icon: Wrench,
  },
  // {
  //   to: "/mini-admin/admin",
  //   label: "Admin",
  //   icon: ShieldCheck,
  // },
  {
    to: "/mini-admin/Admin/vendors",
    label: "Vendor Management",
    icon: Building2,
  },
  {
    to: "/mini-admin/Admin/Clients",
    label: "Client Projects",
    icon: Users,
  },
  {
    to: "/mini-admin/Admin/analysis",
    label: "Analysis",
    icon: BarChart3,
  },
  {
    to: "/mini-admin/Todo/todo",
    label: "To Do List",
    icon: ClipboardList,
  },
];
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card shadow-sm flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold">
            Mini Admin
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const active =
              pathname === link.to ||
              pathname.startsWith(link.to + "/");

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
  <Button
    variant="ghost"
    className="w-full justify-start"
    onClick={handleSignOut}
  >
    <LogOut className="mr-2 h-5 w-5" />
    Sign Out
  </Button>
</div>
      </aside>

      {/* Main Page */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}