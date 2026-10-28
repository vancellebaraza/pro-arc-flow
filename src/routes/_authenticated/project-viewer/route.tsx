import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/requireRole";

export const Route = createFileRoute("/_authenticated/project-viewer")({
  component: ProjectViewerLayout,
  beforeLoad: async () => {
    await requireRole(["project_view_admin", "admin"]);
  },
});

// The shared authenticated layout already provides the shell, so this only renders the page.
function ProjectViewerLayout() {
  return <Outlet />;
}
