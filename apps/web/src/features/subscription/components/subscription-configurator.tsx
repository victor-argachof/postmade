import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
import {
  SUBSCRIPTION_INCLUDED_QUANTITIES,
  SUBSCRIPTION_MAX_QUANTITIES,
  calculateSubscriptionPrice,
  normalizeSubscriptionQuantity,
  type SubscriptionCurrency,
} from "@/features/workspaces/lib/subscription-pricing";
import type {
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
  onBlockedDecrease,
  value,
}: {
  label: string;
  decreaseLabel: string;
  disabled?: boolean;
  increaseLabel: string;
  maximum: number;
  minimum: number;
  onChange: (value: number) => void;
  onBlockedDecrease?: () => void;
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
        <Button
          aria-disabled={disabled || value <= minimum}
          aria-label={decreaseLabel}
          className="size-9 shrink-0 self-center rounded-full p-0 aria-disabled:opacity-50"
          disabled={disabled}
          onClick={() => value <= minimum ? onBlockedDecrease?.() : onChange(value - 1)}
          size="icon"
          type="button"
          variant="outline"
        >
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
  minimumConfiguration = SUBSCRIPTION_INCLUDED_QUANTITIES,
  onManage,
  onSubscribe,
  onUpdate,
  isUpdating = false,
  usage,
  status = "trialing",
}: {
  configuration: WorkspaceSubscriptionConfiguration;
  minimumConfiguration?: WorkspaceSubscriptionConfiguration;
  onManage?: () => void;
  onSubscribe?: (configuration: WorkspaceSubscriptionConfiguration) => void;
  onUpdate?: (configuration: WorkspaceSubscriptionConfiguration) => Promise<boolean>;
  isUpdating?: boolean;
  usage?: { connectedChannels: number; members: number; pendingInvitations: number };
  status?: SubscriptionStatus;
}) {
  const { t, i18n } = useTranslation("subscription");
  const [quantities, setQuantities] = useState(configuration);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [blockedResource, setBlockedResource] = useState<keyof WorkspaceSubscriptionConfiguration | null>(null);
  const checkoutFlow = status === "trialing" || status === "canceled" || status === "expired";
  const updateFlow = status === "active";
  const canConfigure = checkoutFlow || (updateFlow && Boolean(onUpdate));
  const hasChanges = quantities.channels !== configuration.channels
    || quantities.members !== configuration.members;
  const currency: SubscriptionCurrency = i18n.resolvedLanguage?.toLowerCase().startsWith("pt-br") ? "BRL" : "USD";
  const locale = currency === "BRL" ? "pt-BR" : "en-US";
  const price = calculateSubscriptionPrice(quantities, currency);

  useEffect(() => {
    setQuantities(configuration);
  }, [configuration.channels, configuration.members]);

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
  const confirmUpdate = async () => {
    if (!onUpdate || !hasChanges) return;
    const accepted = await onUpdate(quantities);
    if (!accepted) return;
    setShowUpdateConfirmation(false);
    setQuantities(configuration);
  };

  return (
    <section id="subscription-configurator" className="mt-16 scroll-mt-24" aria-labelledby="configurator-title">
      <div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t("configurator.eyebrow")}</p>
          <h2 id="configurator-title" className="mt-3 text-3xl font-black tracking-tight">{t("configurator.title")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("configurator.description")}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <QuantityControl
              decreaseLabel={t("configurator.decrease", { resource: t("configurator.channels").toLowerCase() })}
              disabled={!canConfigure}
              increaseLabel={t("configurator.increase", { resource: t("configurator.channels").toLowerCase() })}
              label={t("configurator.channels")}
              maximum={SUBSCRIPTION_MAX_QUANTITIES.channels}
              minimum={minimumConfiguration.channels}
              onChange={(value) => setQuantity("channels", value)}
              onBlockedDecrease={() => setBlockedResource("channels")}
              value={quantities.channels}
            />
            <QuantityControl
              decreaseLabel={t("configurator.decrease", { resource: t("configurator.members").toLowerCase() })}
              disabled={!canConfigure}
              increaseLabel={t("configurator.increase", { resource: t("configurator.members").toLowerCase() })}
              label={t("configurator.members")}
              maximum={SUBSCRIPTION_MAX_QUANTITIES.members}
              minimum={minimumConfiguration.members}
              onChange={(value) => setQuantity("members", value)}
              onBlockedDecrease={() => setBlockedResource("members")}
              value={quantities.members}
            />
          </div>
          {status === "past_due" && <p className="mt-4 text-sm text-muted-foreground">{t("configurator.pastDueChanges")}</p>}
          <ul className="mt-7 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {includedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{t(feature)}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-label={t("configurator.summary") }>
          <h3 className="text-xl font-black">{t("configurator.summary")}</h3>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4"><dt>{t("configurator.channels")}</dt><dd className="font-bold">{quantities.channels}</dd></div>
            <div className="flex justify-between gap-4"><dt>{t("configurator.members")}</dt><dd className="font-bold">{quantities.members}</dd></div>
          </dl>
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">{t("configurator.monthlyPrice")}</p>
            <p className="mt-1 text-4xl font-black tracking-tight">{formatPrice(price.monthly)}<span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span></p>
          </div>
          <Button
            className="mt-6 w-full"
            disabled={checkoutFlow ? !onSubscribe : updateFlow ? !onUpdate || !hasChanges || isUpdating : !onManage}
            onClick={() => checkoutFlow
              ? onSubscribe?.(quantities)
              : updateFlow
                ? setShowUpdateConfirmation(true)
                : onManage?.()}
            type="button"
          >
            {isUpdating
              ? t("configurator.updating")
              : t(checkoutFlow ? "configurator.subscribe" : updateFlow ? "configurator.update" : "manageSubscription")}
          </Button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("localizedPricingNote")}</p>
        </aside>
      </div>
      <Modal
        closeLabel={t("configurator.closeUpdate")}
        onClose={() => setShowUpdateConfirmation(false)}
        open={showUpdateConfirmation}
        title={t("configurator.confirmUpdateTitle")}
      >
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{t("configurator.confirmUpdateDescription")}</p>
        <dl className="mt-6 space-y-3 rounded-2xl bg-muted p-4 text-sm">
          <div className="flex justify-between gap-4"><dt>{t("configurator.channels")}</dt><dd className="font-bold">{configuration.channels} → {quantities.channels}</dd></div>
          <div className="flex justify-between gap-4"><dt>{t("configurator.members")}</dt><dd className="font-bold">{configuration.members} → {quantities.members}</dd></div>
        </dl>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isUpdating} onClick={() => setShowUpdateConfirmation(false)} type="button" variant="outline">{t("configurator.cancelUpdate")}</Button>
          <Button disabled={isUpdating} onClick={() => void confirmUpdate()} type="button">{isUpdating ? t("configurator.updating") : t("configurator.confirmUpdate")}</Button>
        </div>
      </Modal>
      <Modal
        closeLabel={t("configurator.closeLimit")}
        onClose={() => setBlockedResource(null)}
        open={blockedResource !== null}
        title={t("configurator.reductionBlockedTitle")}
      >
        {blockedResource && (
          <>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {blockedResource === "channels"
                ? minimumConfiguration.channels > SUBSCRIPTION_INCLUDED_QUANTITIES.channels
                  ? t("configurator.channelsInUse", { count: usage?.connectedChannels ?? minimumConfiguration.channels })
                  : t("configurator.channelsMinimum", { count: SUBSCRIPTION_INCLUDED_QUANTITIES.channels })
                : minimumConfiguration.members > SUBSCRIPTION_INCLUDED_QUANTITIES.members
                  ? t("configurator.membersInUse", {
                    members: usage?.members ?? minimumConfiguration.members,
                    invitations: usage?.pendingInvitations ?? 0,
                    count: minimumConfiguration.members,
                  })
                  : t("configurator.membersMinimum", { count: SUBSCRIPTION_INCLUDED_QUANTITIES.members })}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setBlockedResource(null)} type="button" variant="outline">{t("configurator.understood")}</Button>
              {blockedResource === "channels" && minimumConfiguration.channels > SUBSCRIPTION_INCLUDED_QUANTITIES.channels && (
                <Link className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90" onClick={() => setBlockedResource(null)} to={ROUTES.workspaceChannels}>{t("configurator.manageChannels")}</Link>
              )}
              {blockedResource === "members" && minimumConfiguration.members > SUBSCRIPTION_INCLUDED_QUANTITIES.members && (
                <Link className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90" onClick={() => setBlockedResource(null)} to={ROUTES.workspaceMembers}>{t("configurator.manageMembers")}</Link>
              )}
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
