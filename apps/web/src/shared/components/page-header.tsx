import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <header className={className}>
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      {title && (
        <h1
          className={cn(
            "text-4xl font-black tracking-tight",
            eyebrow && "mt-4",
          )}
        >
          {title}
        </h1>
      )}
      {description && (
        <p
          className={cn(
            "max-w-2xl text-base text-muted-foreground",
            (eyebrow || title) && "mt-4",
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
