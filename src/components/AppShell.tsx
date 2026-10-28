import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronsLeft, ChevronsRight, LogOut, Menu } from "lucide-react";
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

const STORAGE_KEY = "fusionpro.sidebar";
type SidebarPref = "expanded" | "collapsed" | null;

function readPref(): SidebarPref {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "expanded" || value === "collapsed" ? value : null;
  } catch {
    return null;
  }
}

function writePref(value: Exclude<SidebarPref, null>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable (private mode, blocked); the toggle still works for this visit.
  }
}

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

function initialsOf(name: string) {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Floating dark sidebar + content area shared by the role layouts.
 * It only renders navigation; role checks stay in each route's beforeLoad.
 *
 * Sidebar default: expanded from lg up, icon-only below. The user's choice from the
 * toggle button is remembered in localStorage.
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
  /** Optional round icon buttons; a compact bar is rendered only when this is passed. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primaryRole, loading, user } = useMyRoles();

  const [pref, setPref] = useState<SidebarPref>(null);
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    setPref(readPref());
    const query = window.matchMedia("(min-width: 1024px)");
    setIsLarge(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsLarge(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const collapsed = pref ? pref === "collapsed" : !isLarge;

  const toggle = useCallback(() => {
    const next = collapsed ? "expanded" : "collapsed";
    setPref(next);
    writePref(next);
  }, [collapsed]);

  // Before the stored choice is known, use the responsive default so there is no flash.
  const sidebarWidth = pref
    ? collapsed
      ? "w-[4.75rem]"
      : "w-64"
    : "w-[4.75rem] lg:w-64";
  const showLabel = pref ? (collapsed ? "hidden" : "inline") : "hidden lg:inline";
  const showBlock = pref ? (collapsed ? "hidden" : "block") : "hidden lg:block";
  const rowAlign = pref
    ? collapsed
      ? "justify-center"
      : "justify-start pr-4"
    : "justify-center lg:justify-start lg:pr-4";

  const metadata = user?.user_metadata as { full_name?: string } | undefined;
  const displayName = metadata?.full_name || user?.email?.split("@")[0] || "";
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed inset-x-3 top-3 z-50 flex h-14 items-center justify-between rounded-2xl border bg-card pl-4 pr-2 shadow-[var(--shadow-card)] md:hidden">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-auto" />
          <h1 className="font-display text-[1.75rem] font-bold leading-tight text-base">{title}</h1>
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
      <aside
        className={`sticky top-3 m-3 hidden h-[calc(100vh-1.5rem)] ${sidebarWidth} shrink-0 flex-col self-start overflow-hidden rounded-[28px] bg-[var(--ink)] p-3 text-white transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex lg:top-4 lg:m-4 lg:h-[calc(100vh-2rem)] dark:border dark:border-white/10`}
      >
        <div
          className={`flex shrink-0 items-center gap-3 ${
            collapsed ? "flex-col" : "h-14 justify-between"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-[var(--shadow-raised)]">
              <Logo className="h-full w-full object-contain" />
            </span>
            {!collapsed && (
              <span className="font-display truncate text-lg font-semibold">{title}</span>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="tile-ink press grid h-8 w-8 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {links.map((link, index) => {
            const active = isActive(pathname, link.to);
            const showGroup = link.group && link.group !== links[index - 1]?.group;

            return (
              <div key={link.to}>
                {showGroup && (
                  <p className={`${showBlock} px-3 pb-1 pt-3 text-xs font-medium text-white/60`}>
                    {link.group}
                  </p>
                )}
                <Link
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  title={link.label}
                  className={`press flex items-center gap-3 rounded-2xl p-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${rowAlign} ${
                    active
                      ? "bg-white/12 font-medium text-white"
                      : "text-white/75 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      active ? "tile-brand" : "tile-ink"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                  </span>
                  <span className={`${showLabel} truncate`}>{link.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-2 shrink-0 space-y-2 border-t border-white/10 pt-3">
          {!loading && (
            <div
              className={`flex items-center gap-3 ${
                pref
                  ? collapsed
                    ? "justify-center"
                    : "px-1.5"
                  : "justify-center lg:justify-start lg:px-1.5"
              }`}
              title={displayName}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {initialsOf(displayName)}
              </span>
              <div className={`${showBlock} min-w-0`}>
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-white/65">{ROLE_LABEL[primaryRole]}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            title="Sign Out"
            className={`press flex w-full items-center gap-3 rounded-2xl p-1.5 text-sm text-white/75 outline-none hover:bg-white/6 hover:text-white focus-visible:ring-2 focus-visible:ring-ring ${rowAlign}`}
          >
            <span className="tile-ink grid h-11 w-11 shrink-0 place-items-center rounded-xl">
              <LogOut className="h-5 w-5" />
            </span>
            <span className={showLabel}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Content: fills the space to the right of the sidebar */}
      <main className="mt-20 min-w-0 flex-1 px-4 pb-6 md:mt-0 md:px-5 md:pt-4 xl:px-6">
        {actions && (
          <div className="mb-4 hidden h-12 items-center justify-end gap-2 md:flex">{actions}</div>
        )}
        {children}
      </main>
    </div>
  );
}
