import { CalendarClock, Check, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";

const benefitKeys = [
  "unlimitedPosts",
  "crossPosting",
  "scheduling",
  "platformCustomization",
  "calendar",
] as const;

interface SubscriptionSummaryProps {
  plan?: "creator" | "growth" | "pro";
  trialing?: boolean;
  totalDays?: number;
  remainingDays?: number;
  postLimit?: number;
  postsUsed?: number;
  channelLimit?: number;
  channelsConnected?: number;
  onSubscribe?: () => void;
}

interface UsageMeterProps {
  label: string;
  valueLabel: string;
  value: number;
  maximum: number;
}

function UsageMeter({ label, valueLabel, value, maximum }: UsageMeterProps) {
  const safeMaximum = Math.max(maximum, 0);
  const safeValue = Math.min(Math.max(value, 0), safeMaximum);
  const percentage = safeMaximum > 0 ? (safeValue / safeMaximum) * 100 : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{valueLabel}</p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMaximum}
        aria-valuenow={safeValue}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function SubscriptionSummary({
  plan = "creator",
  trialing = true,
  totalDays = 15,
  remainingDays = 15,
  postLimit = 3,
  postsUsed = 0,
  channelLimit = 3,
  channelsConnected = 0,
  onSubscribe,
}: SubscriptionSummaryProps) {
  const { t } = useTranslation("subscription");
  const safeTotalDays = Math.max(totalDays, 0);
  const safeRemainingDays = Math.min(Math.max(remainingDays, 0), safeTotalDays);
  return (
    <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
      <section className="rounded-3xl border border-primary/25 bg-card p-6 shadow-sm sm:p-8" aria-labelledby="trial-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{t("statusTitle")}</p>
            <span className="mt-2 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              {t(trialing ? "trialActive" : "planActive", { plan: t(`plans.${plan}.name`) })}
            </span>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="size-5" aria-hidden="true" />
          </div>
        </div>

        <h2 id="trial-title" className="mt-8 text-2xl font-black tracking-tight">{t(trialing ? "trialTitle" : "activePlanTitle", { plan: t(`plans.${plan}.name`) })}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t(trialing ? "trialDescription" : "activePlanDescription")}</p>

        <div className="mt-8 space-y-6 rounded-2xl bg-muted p-5">
          {trialing && <UsageMeter
              label={t("progressLabel")}
              valueLabel={t("daysUsage", { remaining: safeRemainingDays, total: safeTotalDays })}
              value={safeRemainingDays}
              maximum={safeTotalDays}
            />}
          <UsageMeter
            label={t("postsLimitLabel")}
            valueLabel={t("usageOfLimit", { used: postsUsed, limit: postLimit })}
            value={postsUsed}
            maximum={postLimit}
          />
          <UsageMeter
            label={t("channelsLimitLabel")}
            valueLabel={t("usageOfLimit", { used: channelsConnected, limit: channelLimit })}
            value={channelsConnected}
            maximum={channelLimit}
          />
        </div>

      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="subscribe-card-title">
        <div className="flex items-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
        </div>
        <h2 id="subscribe-card-title" className="mt-6 text-lg font-bold">{t("subscribeCardTitle")}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("subscribeCardDescription")}</p>
        <ul className="mt-6 space-y-3">
          {benefitKeys.map((key) => (
            <li key={key} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          className="mt-6 w-full"
          onClick={onSubscribe}
          disabled={!onSubscribe}
          aria-describedby={!onSubscribe ? "checkout-integration-note" : undefined}
        >
          {t("subscribeNow")}
        </Button>
        {!onSubscribe && (
          <p id="checkout-integration-note" className="mt-3 text-xs leading-5 text-muted-foreground">
            {t("checkoutPending")}
          </p>
        )}
      </section>
    </div>
  );
}
