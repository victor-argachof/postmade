import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";

type BillingCycle = "monthly" | "annual";
type PlanId = "creator" | "growth" | "pro";

const commonFeatures = [
  "multipleAccounts",
  "unlimitedPosts",
  "schedulePosts",
  "carouselPosts",
  "bulkVideo",
  "contentStudio",
] as const;

const plans: Array<{
  id: PlanId;
  accountFeature: string;
  extraFeatures: readonly string[];
  badge?: string;
  monthly: { USD: number; BRL: number };
}> = [
  {
    id: "creator",
    accountFeature: "accounts15",
    extraFeatures: ["humanSupport"],
    badge: "mostPopular",
    monthly: { USD: 29, BRL: 149 },
  },
  {
    id: "growth",
    accountFeature: "accounts50",
    extraFeatures: ["prioritySupport", "teamMembers"],
    monthly: { USD: 49, BRL: 249 },
  },
  {
    id: "pro",
    accountFeature: "accountsUnlimited",
    extraFeatures: ["prioritySupport", "teamMembers"],
    badge: "bestDeal",
    monthly: { USD: 99, BRL: 499 },
  },
];

interface PricingPlansProps {
  onSelectPlan?: (plan: PlanId, cycle: BillingCycle) => void;
}

export function PricingPlans({ onSelectPlan }: PricingPlansProps) {
  const { t, i18n } = useTranslation("subscription");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const isBrazilianPortuguese = i18n.resolvedLanguage?.toLowerCase().startsWith("pt-br");
  const currency = isBrazilianPortuguese ? "BRL" : "USD";
  const locale = isBrazilianPortuguese ? "pt-BR" : "en-US";

  const formatPrice = (value: number) => new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <section id="pricing-plans" className="mt-16 scroll-mt-24" aria-labelledby="plans-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t("plansEyebrow")}</p>
          <h2 id="plans-title" className="mt-3 text-3xl font-black tracking-tight">{t("plansTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("plansDescription")}</p>
        </div>
        <div className="inline-flex w-fit rounded-xl bg-muted p-1" aria-label={t("billingCycleLabel")}>
          {(["monthly", "annual"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition-colors ${billingCycle === cycle ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setBillingCycle(cycle)}
              aria-pressed={billingCycle === cycle}
            >
              {t(cycle)}
              {cycle === "annual" && <span className="ml-2 text-xs text-primary">{t("annualSavings")}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-stretch gap-6 xl:grid-cols-3">
        {plans.map((plan) => {
          const monthlyPrice = plan.monthly[currency];
          const displayedPrice = billingCycle === "annual" ? Math.round((monthlyPrice * 10) / 12) : monthlyPrice;
          const annualTotal = monthlyPrice * 10;
          const features = [plan.accountFeature, ...commonFeatures, ...plan.extraFeatures];

          return (
            <article
              key={plan.id}
              className={`relative flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm ${plan.badge === "mostPopular" ? "border-primary ring-1 ring-primary" : "border-border"}`}
            >
              {plan.badge && (
                <span className="absolute right-5 top-5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {t(plan.badge)}
                </span>
              )}
              <h3 className="pr-24 text-xl font-black">{t(`plans.${plan.id}.name`)}</h3>
              <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{t(`plans.${plan.id}.description`)}</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight">{formatPrice(displayedPrice)}</span>
                <span className="pb-1 text-sm text-muted-foreground">{t("perMonth")}</span>
              </div>
              <p className="mt-2 min-h-5 text-xs text-muted-foreground">
                {billingCycle === "annual" ? t("billedAnnually", { total: formatPrice(annualTotal) }) : t("billedMonthly")}
              </p>
              <Button
                type="button"
                className="mt-6 w-full"
                variant={plan.badge === "mostPopular" ? "default" : "outline"}
                onClick={() => onSelectPlan?.(plan.id, billingCycle)}
                disabled={!onSelectPlan}
              >
                {t("getStarted")}
              </Button>
              <ul className="mt-6 space-y-3 border-t border-border pt-6">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className={feature === plan.accountFeature ? "font-bold text-foreground" : undefined}>{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("localizedPricingNote")}</p>
    </section>
  );
}
