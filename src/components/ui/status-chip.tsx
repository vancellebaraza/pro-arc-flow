import { cn } from "@/lib/utils";
import { STATUS_LABEL, statusColorClasses } from "@/lib/services";

/** Dot + label built from the existing status colour classes. */
export function StatusChip({ status, className }: { status: string; className?: string }) {
  const colors = statusColorClasses(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
