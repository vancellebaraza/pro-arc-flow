import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppRole } from "@/lib/auth";
import { useMyRoles } from "@/lib/auth";

export type ShellLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Optional small group label shown above this link when it differs from the previous one. */
  group?: string;
};

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  accountant: "Accountant",
  mini_admin: "Mini admin",
  engineer: "Engineer",
  project_view_admin: "Project viewer",
  client: "Client",
};

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

/**
 * Sidebar + mobile top bar + content area shared by the role layouts.
 * It only renders navigation; role checks stay in each route's beforeLoad.
 */
export function AppShell({
  title,
  links,
  onSignOut,
  children,
}: {
  title: string;
  links: ShellLink[];
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primaryRole, loading } = useMyRoles();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-auto" />
          <h1 className="font-display text-base font-semibold">{title}</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-2 w-64">
            {links.map((link) => (
              <DropdownMenuItem key={link.to} asChild>
                <Link
                  to={link.to}
                  className={`flex w-full items-center gap-3 ${
                    isActive(pathname, link.to) ? "font-semibold text-primary" : ""
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col border-r bg-card md:flex lg:w-60">
        <div className="flex h-16 items-center justify-center gap-3 border-b px-3 lg:justify-start lg:px-5">
          <Logo className="h-8 w-auto" />
          <span className="font-display hidden text-base font-semibold lg:inline">{title}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map((link, index) => {
            const active = isActive(pathname, link.to);
            const showGroup = link.group && link.group !== links[index - 1]?.group;

            return (
              <div key={link.to}>
                {showGroup && (
                  <p className="hidden px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground lg:block">
                    {link.group}
                  </p>
                )}
                <Link
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors lg:justify-start ${
                    active
                      ? "bg-brand/8 font-medium text-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="border-t p-3">
          {!loading && (
            <p className="hidden px-3 pb-2 text-xs text-muted-foreground lg:block">
              {ROLE_LABEL[primaryRole]}
            </p>
          )}
          <Button
            variant="ghost"
            className="w-full justify-center text-muted-foreground lg:justify-start"
            onClick={onSignOut}
          >
            <LogOut className="h-5 w-5 lg:mr-2" />
            <span className="hidden lg:inline">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="mt-16 min-w-0 flex-1 overflow-y-auto md:mt-0">
        <div className="mx-auto w-full max-w-[80rem]">{children}</div>
      </main>
    </div>
  );
}
