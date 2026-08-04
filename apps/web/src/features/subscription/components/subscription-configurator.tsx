import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  SUBSCRIPTION_INCLUDED_QUANTITIES,
  SUBSCRIPTION_MAX_QUANTITIES,
  calculateSubscriptionPrice,
  normalizeSubscriptionQuantity,
  type SubscriptionCurrency,
} from "@/features/workspaces/lib/subscription-pricing";
import type {
  BillingCycle,
  SubscriptionStatus,
  WorkspaceSubscriptionConfiguration,
} from "@/features/workspaces/types";

const includedFeatures = [
  "unlimitedPosts",
  "multipleAccounts",
  "schedulePosts",
  "carouselPosts",
  "bulkVideo",
  "contentStudio",
  "humanSupport",
] as const;

function QuantityControl({
  label,
  decreaseLabel,
  disabled = false,
  increaseLabel,
  maximum,
  minimum,
  onChange,
  value,
}: {
  label: string;
  decreaseLabel: string;
  disabled?: boolean;
  increaseLabel: string;
  maximum: number;
  minimum: number;
  onChange: (value: number) => void;
  value: number;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commitDraft = () => {
    const parsed = Number(draft);
    const next = Math.min(Math.max(Number.isFinite(parsed) ? Math.round(parsed) : minimum, minimum), maximum);
    setDraft(String(next));
    onChange(next);
  };
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <label className="text-sm font-bold" htmlFor={inputId}>{label}</label>
      <div className="mt-4 flex items-center gap-3">
        <Button aria-label={decreaseLabel} className="size-9 shrink-0 self-center rounded-full p-0" disabled={disabled || value <= minimum} onClick={() => onChange(value - 1)} size="icon" type="button" variant="outline">
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <Input
          className="min-w-0 text-center font-bold"
          id={inputId}
          inputMode="numeric"
          disabled={disabled}
          max={maximum}
          min={minimum}
          onBlur={commitDraft}
          onChange={(event) => {
            if (/^\d*$/.test(event.target.value)) setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }
          }}
          type="number"
          value={draft}
        />
        <Button aria-label={increaseLabel} className="size-9 shrink-0 self-center rounded-full p-0" disabled={disabled || value >= maximum} onClick={() => onChange(value + 1)} size="icon" type="button" variant="outline">
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{minimum}–{maximum}</p>
    </div>
  );
}

export function SubscriptionConfigurator({
  configuration,
  currentBillingCycle,
  minimumConfiguration = SUBSCRIPTION_INCLUDED_QUANTITIES,
  onManage,
  onSubscribe,
  status = "trialing",
}: {
  configuration: WorkspaceSubscriptionConfiguration;
  currentBillingCycle?: BillingCycle | null;
  minimumConfiguration?: WorkspaceSubscriptionConfiguration;
  onManage?: () => void;
  onSubscribe?: (configuration: WorkspaceSubscriptionConfiguration, cycle: BillingCycle) => void;
  status?: SubscriptionStatus;
}) {
  const { t, i18n } = useTranslation("subscription");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(currentBillingCycle ?? "monthly");
  const [quantities, setQuantities] = useState(configuration);
  const checkoutFlow = status === "trialing" || status === "canceled" || status === "expired";
  const currency: SubscriptionCurrency = i18n.resolvedLanguage?.toLowerCase().startsWith("pt-br") ? "BRL" : "USD";
  const locale = currency === "BRL" ? "pt-BR" : "en-US";
  const price = calculateSubscriptionPrice(quantities, currency, billingCycle);
  const monthlyEquivalent = billingCycle === "annual" ? price.billedTotal / 12 : price.monthly;

  useEffect(() => {
    setQuantities(configuration);
    setBillingCycle(currentBillingCycle ?? "monthly");
  }, [configuration.channels, configuration.members, currentBillingCycle]);

  const formatPrice = (value: number) => new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value / 100);
  const setQuantity = (resource: keyof WorkspaceSubscriptionConfiguration, value: number) => {
    setQuantities((current) => ({
      ...current,
      [resource]: normalizeSubscriptionQuantity(value, resource, minimumConfiguration[resource]),
    }));
  };

  return (
    <section id="subscription-configurator" className="mt-16 scroll-mt-24" aria-labelledby="configurator-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t("configurator.eyebrow")}</p>
          <h2 id="configurator-title" className="mt-3 text-3xl font-black tracking-tight">{t("configurator.title")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("configurator.description")}</p>
        </div>
        <div className="inline-flex w-fit rounded-xl bg-muted p-1" aria-label={t("billingCycleLabel") }>
          {(["monthly", "annual"] as const).map((cycle) => (
            <button
              key={cycle}
              aria-pressed={billingCycle === cycle}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition-colors ${billingCycle === cycle ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              disabled={!checkoutFlow}
              onClick={() => setBillingCycle(cycle)}
              type="button"
            >
              {t(cycle)}{cycle === "annual" && <span className="ml-2 text-xs text-primary">{t("annualSavings")}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <QuantityControl
              decreaseLabel={t("configurator.decrease", { resource: t("configurator.channels").toLowerCase() })}
              disabled={!checkoutFlow}
              increaseLabel={t("configurator.increase", { resource: t("configurator.channels").toLowerCase() })}
              label={t("configurator.channels")}
              maximum={SUBSCRIPTION_MAX_QUANTITIES.channels}
              minimum={minimumConfiguration.channels}
              onChange={(value) => setQuantity("channels", value)}
              value={quantities.channels}
            />
            <QuantityControl
              decreaseLabel={t("configurator.decrease", { resource: t("configurator.members").toLowerCase() })}
              disabled={!checkoutFlow}
              increaseLabel={t("configurator.increase", { resource: t("configurator.members").toLowerCase() })}
              label={t("configurator.members")}
              maximum={SUBSCRIPTION_MAX_QUANTITIES.members}
              minimum={minimumConfiguration.members}
              onChange={(value) => setQuantity("members", value)}
              value={quantities.members}
            />
          </div>
          {!checkoutFlow && <p className="mt-4 text-sm text-muted-foreground">{t("configurator.portalChanges")}</p>}
          <ul className="mt-7 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {includedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{t(feature)}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-3xl border border-primary/25 bg-card p-6 shadow-sm sm:p-8" aria-label={t("configurator.summary") }>
          <h3 className="text-xl font-black">{t("configurator.summary")}</h3>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4"><dt>{t("configurator.channels")}</dt><dd className="font-bold">{quantities.channels}</dd></div>
            <div className="flex justify-between gap-4"><dt>{t("configurator.members")}</dt><dd className="font-bold">{quantities.members}</dd></div>
          </dl>
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">{t("configurator.monthlyEquivalent")}</p>
            <p className="mt-1 text-4xl font-black tracking-tight">{formatPrice(monthlyEquivalent)}<span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span></p>
            {billingCycle === "annual" && (
              <p className="mt-2 text-xs text-muted-foreground">{t("billedAnnually", { total: formatPrice(price.billedTotal) })}</p>
            )}
          </div>
          <Button
            className="mt-6 w-full"
            disabled={checkoutFlow ? !onSubscribe : !onManage}
            onClick={() => checkoutFlow ? onSubscribe?.(quantities, billingCycle) : onManage?.()}
            type="button"
          >
            {t(checkoutFlow ? "configurator.subscribe" : "manageSubscription")}
          </Button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("localizedPricingNote")}</p>
        </aside>
      </div>
    </section>
  );
}
