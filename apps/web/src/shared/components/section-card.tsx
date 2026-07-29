import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  titleClassName,
}: SectionCardProps) {
  const titleId = useId();

  return (
    <section
      className={cn("rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8", className)}
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className={cn("text-lg font-bold", titleClassName)}>{title}</h2>
            {description && (
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children && <div className={contentClassName}>{children}</div>}
    </section>
  );
}
