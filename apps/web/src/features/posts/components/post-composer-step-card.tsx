import type { ReactNode } from "react";

export function PostComposerStepCard({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className="relative rounded-2xl border border-border bg-card">
      <header className="flex min-h-14 items-center justify-between gap-4 rounded-t-[calc(1rem-1px)] border-b border-border bg-muted/30 px-5 py-3.5">
        <h2 className="font-bold">{title}</h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
