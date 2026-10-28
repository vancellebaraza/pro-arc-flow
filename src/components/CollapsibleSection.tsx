import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  /** localStorage key that remembers the open state in this browser. */
  storageKey: string;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  count,
  storageKey,
  children,
  className,
}: CollapsibleSectionProps) {
  const panelId = useId();
  const [open, setOpen] = useState(true);
  // Transitions only switch on after the stored value is applied, so a saved "collapsed"
  // state does not animate shut on every page load.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "collapsed") setOpen(false);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); stay expanded.
    }
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [storageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey, next ? "expanded" : "collapsed");
    } catch {
      // Ignore: the section still works, it just will not be remembered.
    }
  }

  return (
    <section className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 rounded-xl py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
          {count}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ml-auto h-5 w-5 shrink-0 text-muted-foreground",
            ready && "transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid",
          ready &&
            "transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
