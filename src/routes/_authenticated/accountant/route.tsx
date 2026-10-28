import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AccountantBackdrop } from "@/components/AccountantBackdrop";
import { requireRole } from "@/lib/requireRole";
import {
  LayoutDashboard,
  Landmark,
  BarChart3,
  FileText,
  Receipt,
  Wallet,
  HandCoins,
  BookOpen,
  Library,
  Banknote,
  Upload,
  CheckSquare,
  ScrollText,
  History,
  BookOpenCheck,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/accountant")({
  component: AccountantLayout,
  beforeLoad: async () => {
    await requireRole(["accountant", "admin"], "/auth");
  },
});

function AccountantLayout() {
  const navigate = useNavigate();

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
      to: "/accountant/account-ledger",
      label: "Account Ledger",
      icon: BookOpenCheck,
    },
    {
      to: "/accountant/journal",
      label: "Journal",
      icon: Library,
    },
    {
      to: "/accountant/analysis",
      label: "Analysis",
      icon: BarChart3,
    },
    {
      to: "/accountant/audit-log",
      label: "Audit Log",
      icon: History,
    },
    {
      to: "/accountant/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <AppShell title="Accountant" links={links} onSignOut={handleSignOut}>
      <div className="relative isolate">
        <AccountantBackdrop />
        <Outlet />
      </div>
    </AppShell>
  );
}
