

import {
  Outlet,
  Link,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";

import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/mini-admin")({
  component: MiniAdminLayout,
});

function MiniAdminLayout() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const links = [
    {
      to: "/mini-admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/mini-admin/Engineer/engineer",
      label: "Engineer",
      icon: Wrench,
    },
    {
      to: "/mini-admin/admin",
      label: "Admin",
      icon: ShieldCheck,
    },
    {
      to: "/mini-admin/todos",
      label: "To Do List",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      {/* <aside className="w-64 border-r bg-card shadow-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold">
            Mini Admin
          </h1>
        </div>

        <nav className="p-4 space-y-2">
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
      </aside> */}

      {/* Main Page */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}