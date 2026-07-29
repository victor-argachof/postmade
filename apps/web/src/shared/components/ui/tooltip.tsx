import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface TooltipProps {
  label: string;
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, content, children, className }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex cursor-help items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={label}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute right-0 top-full z-20 mt-2 w-64 rounded-xl bg-foreground px-3 py-2 text-left text-xs font-normal leading-5 text-background opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
