import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireRole } from "@/lib/requireRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/project-viewer")({
  component: ProjectViewerLayout,
  beforeLoad: async () => {
    await requireRole(["project_view_admin", "admin"]);
  },
});

function ProjectViewerLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Eye className="h-5 w-5" />
          Project Viewer
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
