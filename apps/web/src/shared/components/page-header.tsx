import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "hero";
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  variant = "default",
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
            "font-black tracking-tight",
            eyebrow && "mt-4",
            variant === "hero" ? "max-w-3xl text-4xl sm:text-5xl" : "text-4xl",
          )}
        >
          {title}
        </h1>
      )}
      {description && (
        <p
          className={cn(
            "max-w-2xl text-muted-foreground",
            (eyebrow || title) && (variant === "hero" ? "mt-5" : "mt-4"),
            variant === "hero" ? "text-lg leading-8" : "text-base leading-7",
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
