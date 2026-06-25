import { useEffect, useState } from "react";

type Props = {
  status: string;
  className?: string;
};

const STAGES = [
  { key: "requested", label: "Requested" },
  { key: "inspected", label: "Inspected" },
  { key: "quoted", label: "Quoted" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function ProjectProgress({ status, className = "" }: Props) {
  const [mounted, setMounted] = useState(false);

  const activeIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));
  const pct = STAGES.length > 1 ? (activeIndex / (STAGES.length - 1)) * 100 : 0;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  if (status === "rejected") {
    return (
      <div className={`mt-6 ${className}`}>
        <div
          role="status"
          className="rounded-md p-3 flex items-center gap-3"
          style={{
            background: "var(--destructive)",
            color: "var(--destructive-foreground)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2v20M2 12h20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-sm font-medium">This project was rejected.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-6 ${className}`}>
      <div className="text-xs text-muted-foreground mb-3">Project progress</div>
      <div className="relative w-full">
        <div
          className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{ background: "var(--color-border)" }}
        />
        <div
          className="absolute left-4 top-1/2 h-1 -translate-y-1/2 rounded-full transition-all"
          style={{
            background: "var(--brand)",
            width: mounted ? `${pct}%` : "0%",
            transitionDuration: "560ms",
          }}
        />
        <div className="relative z-10 flex justify-between items-center px-4">
          {STAGES.map((s, i) => {
            const done = i <= activeIndex;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center text-center min-w-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors`}
                  style={
                    done
                      ? {
                          background: "var(--brand)",
                          color: "var(--brand-foreground)",
                          borderColor: "var(--brand)",
                        }
                      : {
                          background: "var(--color-surface)",
                          color: "var(--muted-foreground)",
                          borderColor: "var(--color-border)",
                        }
                  }
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full" />
                  )}
                </div>
                <div className="mt-2 text-[11px] leading-tight text-muted-foreground max-w-[80px]">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
