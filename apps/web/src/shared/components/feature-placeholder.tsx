import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function FeaturePlaceholder({ title, description, icon: Icon }: FeaturePlaceholderProps) {
  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader title={title} />
      <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-5 max-w-md text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
