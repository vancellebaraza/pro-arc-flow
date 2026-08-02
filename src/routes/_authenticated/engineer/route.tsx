import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/requireRole";

export const Route = createFileRoute("/_authenticated/engineer")({
  component: EngineerLayout,
  beforeLoad: async () => {
    await requireRole(["engineer", "admin"]);
  },
});

function EngineerLayout() {
  return <Outlet />;
}

