import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROGRESS_CATEGORIES, type ProgressCategory } from "@/lib/progress";

interface Props {
  value: ProgressCategory | null;
  disabled?: boolean;
  onChange: (value: ProgressCategory | null) => void;
}

// Red until a progress is chosen, green once one is set.
export default function ProgressButton({ value, disabled, onChange }: Props) {
  const isSet = value !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={isSet ? `Progress: ${value}. Change progress` : "Set progress"}
          className={`pointer-events-auto inline-flex h-6 max-w-[11rem] items-center gap-1 rounded-md px-2 text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60 ${
            isSet
              ? "bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
              : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
          }`}
        >
          <span className="truncate">{value ?? "Set progress"}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {PROGRESS_CATEGORIES.map((category) => (
          <DropdownMenuItem
            key={category}
            onSelect={() => onChange(category)}
            className="justify-between"
          >
            {category}
            {value === category && <Check className="h-4 w-4 text-green-600" />}
          </DropdownMenuItem>
        ))}
        {isSet && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(null)} className="text-muted-foreground">
              Clear progress
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
