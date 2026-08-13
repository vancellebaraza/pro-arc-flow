import {
  Outlet,
  Link,
  createFileRoute,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/requireRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Landmark,
  BarChart3,
  FileText,
  Receipt,
  Wallet,
  HandCoins,
  BookOpen,
  Banknote,
  Upload,
  CheckSquare,
  ScrollText,
  LogOut,
  Menu,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/accountant")({
  component: AccountantLayout,
  beforeLoad: async () => {
    await requireRole(["accountant", "admin"], "/auth");
  },
});

function AccountantLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = [
    {
      to: "/accountant",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/accountant/accounts",
      label: "Chart of Accounts",
      icon: Landmark,
    },
    {
      to: "/accountant/invoices",
      label: "Invoices",
      icon: FileText,
    },
    {
      to: "/accountant/bills",
      label: "Bills",
      icon: Receipt,
    },
    {
      to: "/accountant/payments",
      label: "Payments",
      icon: Wallet,
    },
    {
      to: "/accountant/vendor-payments",
      label: "Vendor Payments",
      icon: HandCoins,
    },
    {
      to: "/accountant/cashbook",
      label: "Cashbook",
      icon: BookOpen,
    },
    {
      to: "/accountant/bank-accounts",
      label: "Bank Accounts",
      icon: Banknote,
    },
    {
      to: "/accountant/bank-import",
      label: "Import Statement",
      icon: Upload,
    },
    {
      to: "/accountant/reconcile",
      label: "Reconcile",
      icon: CheckSquare,
    },
    {
      to: "/accountant/reports",
      label: "Reports",
      icon: ScrollText,
    },
    {
      to: "/accountant/analysis",
      label: "Analysis",
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
        <h1 className="text-lg font-bold">Accountant</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-2 w-64">
            {links.map((link) => {
              const active = pathname === link.to || pathname.startsWith(link.to + "/");

              return (
                <DropdownMenuItem key={link.to} asChild>
                  <Link
                    to={link.to}
                    className={`flex w-full items-center gap-3 ${active ? "font-semibold text-primary" : ""}`}
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

      <aside className="hidden w-20 flex-col border-r bg-card shadow-sm transition-all duration-300 md:flex lg:w-64">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="hidden text-xl font-bold lg:block">Accountant</h1>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {links.map((link) => {
            const active = pathname === link.to || pathname.startsWith(link.to + "/");

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center justify-center gap-3 rounded-lg px-3 py-3 transition-all lg:justify-start lg:px-4 ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-center lg:justify-start" onClick={handleSignOut}>
            <LogOut className="h-5 w-5 lg:mr-2" />
            <span className="hidden lg:inline">Sign Out</span>
          </Button>
        </div>
      </aside>

      <main className="mt-16 flex-1 overflow-y-auto md:mt-0">
        <Outlet />
      </main>
    </div>
  );
}
