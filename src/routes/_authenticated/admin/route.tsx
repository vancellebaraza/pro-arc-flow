import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/requireRole";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  beforeLoad: async () => {
    await requireRole(["admin"]);
  },
});

function AdminLayout() {
  return <Outlet />;
}

