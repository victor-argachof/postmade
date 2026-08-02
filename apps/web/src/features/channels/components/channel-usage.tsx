import { InfinityIcon, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ChannelUsage({ connected, limit }: { connected: number; limit: number | null }) {
  const { t } = useTranslation("channels");
  const quantity = connected === 1 ? "singular" : "plural";
  const value = limit === null
    ? t(`usage.unlimited.${quantity}`, { count: connected })
    : t("usage.limited", { count: connected, limit });
  const percentage = limit === null ? 100 : Math.min((connected / limit) * 100, 100);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Radio className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("usage.label")}</p>
            <p className="mt-0.5 font-bold">{value}</p>
          </div>
        </div>
        {limit === null && <InfinityIcon className="size-5 text-primary" aria-hidden="true" />}
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        role={limit === null ? "img" : "progressbar"}
        aria-label={value}
        aria-valuemin={limit === null ? undefined : 0}
        aria-valuemax={limit === null ? undefined : limit}
        aria-valuenow={limit === null ? undefined : connected}
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
