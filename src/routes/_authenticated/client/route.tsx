import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/requireRole";

export const Route = createFileRoute("/_authenticated/client")({
  component: ClientLayout,
  beforeLoad: async () => {
    await requireRole(["client", "admin"]);
  },
});

function ClientLayout() {
  return <Outlet />;
}

