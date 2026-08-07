import { ArrowDown, BarChart3, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SUBSCRIPTION_INCLUDED_QUANTITIES } from "@/features/workspaces/lib/subscription-pricing";
import {
  getWorkspaceChannelLimit,
  getWorkspaceMemberLimit,
  WORKSPACE_TRIAL_LIMITS,
} from "@/features/workspaces/lib/workspace-limits";
import type {
  SubscriptionStatus,
  WorkspaceSubscriptionConfiguration,
} from "@/features/workspaces/types";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

const benefitKeys = [
  "unlimitedPosts",
  "crossPosting",
  "scheduling",
  "platformCustomization",
  "calendar",
] as const;

interface SubscriptionSummaryProps {
  configuration?: WorkspaceSubscriptionConfiguration;
  status?: SubscriptionStatus;
  postsUsed?: number;
  channelsConnected?: number;
  membersUsed?: number;
  onSubscribe?: () => void;
}

interface UsageMeterProps {
  label: string;
  valueLabel: string;
  value: number;
  maximum: number | null;
}

function UsageMeter({ label, valueLabel, value, maximum }: UsageMeterProps) {
  if (maximum === null) {
    return (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-sm font-bold">{valueLabel}</p>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary/15"
          role="img"
          aria-label={`${label}: ${valueLabel}`}
        >
          <div
            className="h-full w-full opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, var(--primary) 0 4px, transparent 4px 8px)",
            }}
          />
        </div>
      </div>
    );
  }

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
  configuration = SUBSCRIPTION_INCLUDED_QUANTITIES,
  status = "trialing",
  postsUsed = 0,
  channelsConnected = 0,
  membersUsed = 1,
  onSubscribe,
}: SubscriptionSummaryProps) {
  const { t } = useTranslation("subscription");
  const trialing = status === "trialing";
  const postLimit = trialing ? WORKSPACE_TRIAL_LIMITS.posts : null;
  const channelLimit = getWorkspaceChannelLimit(configuration, status);
  const memberLimit = getWorkspaceMemberLimit(configuration, status);
  const showSubscribeCard =
    status === "trialing" || status === "canceled" || status === "expired";
  const usageLabel = (used: number, limit: number | null) =>
    limit === null ? t("usageUnlimited") : t("usageOfLimit", { used, limit });

  return (
    <div
      className={cn(
        "mt-10 grid items-stretch gap-6",
        showSubscribeCard &&
          "lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]"
      )}
    >
      <SectionCard
        icon={BarChart3}
        title={t(trialing ? "trialLimitsTitle" : "limitsTitle")}
        description={t(
          trialing ? "trialLimitsDescription" : "limitsDescription"
        )}
      >
        <div className="mt-8 space-y-6 rounded-2xl bg-muted p-5">
          <UsageMeter
            label={t("postsLimitLabel")}
            valueLabel={usageLabel(postsUsed, postLimit)}
            value={postsUsed}
            maximum={postLimit}
          />
          <UsageMeter
            label={t("channelsLimitLabel")}
            valueLabel={usageLabel(channelsConnected, channelLimit)}
            value={channelsConnected}
            maximum={channelLimit}
          />
          <UsageMeter
            label={t("membersLimitLabel")}
            valueLabel={usageLabel(membersUsed, memberLimit)}
            value={membersUsed}
            maximum={memberLimit}
          />
        </div>
      </SectionCard>

      {showSubscribeCard && (
        <SectionCard
          title={t("subscribeCardTitle")}
          description={t("subscribeCardDescription")}
        >
          <ul className="mt-6 space-y-3">
            {benefitKeys.map((key) => (
              <li
                key={key}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {t(key)}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button
              type="button"
              className="w-full"
              onClick={onSubscribe}
              disabled={!onSubscribe}
              aria-describedby={
                !onSubscribe ? "checkout-integration-note" : undefined
              }
            >
              {t("subscribeNow")}
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {!onSubscribe && (
            <p
              id="checkout-integration-note"
              className="mt-3 text-xs leading-5 text-muted-foreground"
            >
              {t("checkoutPending")}
            </p>
          )}
        </SectionCard>
      )}
    </div>
  );
}
