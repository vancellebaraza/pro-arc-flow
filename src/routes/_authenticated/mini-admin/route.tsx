

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  LogOut, 
  Menu ,
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
{/* Mobile Navigation */}
<div className="fixed top-0 left-0 right-0 h-16 border-b bg-card flex items-center justify-between px-4 md:hidden z-50">
  <h1 className="font-bold text-lg">Mini Admin</h1>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      className="w-64 mt-2"
    >
      {links.map((link) => {
        const active =
          pathname === link.to ||
          pathname.startsWith(link.to + "/");

        return (
          <DropdownMenuItem key={link.to} asChild>
            <Link
              to={link.to}
              className={`flex items-center gap-3 w-full ${
                active ? "font-semibold text-primary" : ""
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          </DropdownMenuItem>
        );
      })}

      <DropdownMenuItem onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

{/* Desktop Sidebar */}
<aside className="hidden md:flex w-20 lg:w-64 border-r bg-card shadow-sm flex-col transition-all duration-300">
  <div className="h-16 flex items-center px-6 border-b">
    <h1 className="hidden lg:block text-xl font-bold">
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
          className={`flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 rounded-lg transition-all ${
            active
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          <link.icon className="h-5 w-5" />
          <span className="hidden lg:inline">{link.label}</span>
        </Link>
      );
    })}
  </nav>

  <div className="border-t p-4">
    <Button
      variant="ghost"
      className="w-full justify-center lg:justify-start"
      onClick={handleSignOut}
    >
      <LogOut className="h-5 w-5 lg:mr-2" />
      <span className="hidden lg:inline">Sign Out</span>
    </Button>
  </div>
</aside>

      {/* Main Page */}
      <main className="flex-1 overflow-y-auto mt-16 md:mt-0">
        <Outlet />
      </main>
    </div>
  );
}