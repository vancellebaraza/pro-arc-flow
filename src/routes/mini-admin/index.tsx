
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/mini-admin/")({
  component: MiniAdminDashboard,
});

function MiniAdminDashboard() {
  return (
    <div className="p-8 space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Mini Admin Dashboard
        </h1>

        <p className="text-muted-foreground mt-2">
          Welcome to the Mini Admin Panel.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Total Projects
            </p>

            <h2 className="text-4xl font-bold mt-3">
              0
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Engineers
            </p>

            <h2 className="text-4xl font-bold mt-3">
              0
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Pending Tasks
            </p>

            <h2 className="text-4xl font-bold mt-3">
              0
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Scheduled Jobs
            </p>

            <h2 className="text-4xl font-bold mt-3">
              0
            </h2>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}