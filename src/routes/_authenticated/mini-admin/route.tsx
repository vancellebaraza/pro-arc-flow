import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { requireRole } from "@/lib/requireRole";
import { AppShell } from "@/components/AppShell";

import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/mini-admin")({
  component: MiniAdminLayout,
  beforeLoad: async () => {
    await requireRole(["mini_admin", "admin"], "/auth");
  },
});

function MiniAdminLayout() {
  const navigate = useNavigate();

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
      to: "/mini-admin/Admin/ProjectViewers",
      label: "Project Viewers",
      icon: Eye,
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
    <AppShell title="Mini Admin" links={links} onSignOut={handleSignOut}>
      <Outlet />
    </AppShell>
  );
}
