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

function initialsOf(name: string) {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Floating dark sidebar + top bar + content area shared by the role layouts.
 * It only renders navigation; role checks stay in each route's beforeLoad.
 */
export function AppShell({
  title,
  links,
  onSignOut,
  actions,
  children,
}: {
  title: string;
  links: ShellLink[];
  onSignOut: () => void | Promise<void>;
  /** Optional round icon buttons shown on the right of the top bar. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primaryRole, loading, user } = useMyRoles();

  const activeLink = links.find((link) => isActive(pathname, link.to));
  const pageTitle = activeLink?.label ?? title;
  const metadata = user?.user_metadata as { full_name?: string } | undefined;
  const displayName = metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed inset-x-3 top-3 z-50 flex h-14 items-center justify-between rounded-2xl border bg-card pl-4 pr-2 shadow-[var(--shadow-card)] md:hidden">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-auto" />
          <h1 className="font-display text-base font-semibold">{title}</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-2 w-72">
            {links.map((link) => {
              const active = isActive(pathname, link.to);
              return (
                <DropdownMenuItem key={link.to} asChild>
                  <Link
                    to={link.to}
                    className={`flex w-full items-center gap-3 ${active ? "font-semibold" : ""}`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        active ? "tile-brand" : "tile-ink"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                    </span>
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuItem onClick={onSignOut} className="gap-3">
              <span className="tile-ink grid h-9 w-9 shrink-0 place-items-center rounded-xl">
                <LogOut className="h-4 w-4" />
              </span>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Floating sidebar */}
      <aside className="sticky top-3 m-3 hidden h-[calc(100vh-1.5rem)] w-[4.75rem] shrink-0 flex-col self-start rounded-[28px] bg-[var(--ink)] p-3 text-white md:flex lg:top-4 lg:m-4 lg:h-[calc(100vh-2rem)] lg:w-72 dark:border dark:border-white/10">
        <div className="flex h-14 items-center justify-center gap-3 lg:justify-start lg:px-1">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-[var(--shadow-raised)]">
            <Logo className="h-full w-full object-contain" />
          </span>
          <span className="font-display hidden text-lg font-semibold lg:inline">{title}</span>
        </div>

        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {links.map((link, index) => {
            const active = isActive(pathname, link.to);
            const showGroup = link.group && link.group !== links[index - 1]?.group;

            return (
              <div key={link.to}>
                {showGroup && (
                  <p className="hidden px-3 pb-1 pt-3 text-xs font-medium text-white/50 lg:block">
                    {link.group}
                  </p>
                )}
                <Link
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  title={link.label}
                  className={`press flex items-center justify-center gap-3 rounded-2xl p-1.5 text-sm lg:justify-start lg:pr-4 ${
                    active
                      ? "bg-white/12 font-medium text-white"
                      : "text-white/70 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      active ? "tile-brand" : "tile-ink"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                  </span>
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-2 space-y-2 border-t border-white/10 pt-3">
          {!loading && (
            <div className="flex items-center justify-center gap-3 lg:justify-start lg:px-1.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {initialsOf(displayName)}
              </span>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-white/55">{ROLE_LABEL[primaryRole]}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            title="Sign Out"
            className="press flex w-full items-center justify-center gap-3 rounded-2xl p-1.5 text-sm text-white/70 hover:bg-white/6 hover:text-white lg:justify-start lg:pr-4"
          >
            <span className="tile-ink grid h-11 w-11 shrink-0 place-items-center rounded-xl">
              <LogOut className="h-5 w-5" />
            </span>
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="mt-20 min-w-0 flex-1 md:mt-0">
        <div className="mx-auto w-full max-w-[80rem]">
          <div className="hidden h-20 items-center justify-between gap-4 px-6 md:flex lg:px-8">
            <h2 className="font-display truncate text-2xl font-semibold tracking-tight">
              {pageTitle}
            </h2>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
