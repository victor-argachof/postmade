import { AlertCircle, ArrowRight, Clock3, FileText, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { DashboardSummary } from "../lib/selectors";

type Metric = "channels" | "drafts" | "scheduled" | "failed";

export function DashboardMetrics({
  summary,
  onSelect,
}: {
  summary: DashboardSummary;
  onSelect: (metric: Metric) => void;
}) {
  const { t } = useTranslation("dashboard");
  const metrics = [
    {
      id: "channels" as const,
      value: summary.connectedChannels,
      icon: Radio,
    },
    { id: "drafts" as const, value: summary.drafts, icon: FileText },
    { id: "scheduled" as const, value: summary.scheduled, icon: Clock3 },
    { id: "failed" as const, value: summary.failed, icon: AlertCircle },
  ];

  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ id, value, icon: Icon }) => (
        <button
          className="group flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          key={id}
          type="button"
          onClick={() => onSelect(id)}
        >
          <span className="flex items-start justify-between gap-4">
            <span>
              <span className="text-sm font-semibold text-muted-foreground">
                {t(`metrics.${id}`)}
              </span>
              <span className="mt-2 block text-3xl font-black">{value}</span>
            </span>
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </span>
          <span className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span className="group-hover:underline">
              {t(`metrics.${id}Action`)}
            </span>
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </button>
      ))}
    </div>
  );
}
