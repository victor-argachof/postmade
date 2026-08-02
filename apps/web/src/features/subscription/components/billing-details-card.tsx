import { AlertTriangle, ExternalLink, Info, ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { SectionCard } from "@/shared/components/section-card";
import { Tooltip } from "@/shared/components/ui/tooltip";
import type {
  SubscriptionStatus,
  WorkspacePlan,
} from "@/features/workspaces/types";

const statusStyles: Record<Exclude<SubscriptionStatus, "trialing">, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  past_due: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  canceled: "bg-muted text-muted-foreground",
  expired: "bg-red-500/10 text-red-700 dark:text-red-400",
};

interface BillingDetailsCardProps {
  plan: WorkspacePlan;
  status: Exclude<SubscriptionStatus, "trialing">;
  currentPeriodEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  currency?: string | null;
  nextInvoiceAmount?: number | null;
  paymentMethodBrand?: string | null;
  paymentMethodLast4?: string | null;
  canManage?: boolean;
  isOpeningPortal?: boolean;
  onManage?: () => void;
}

export function BillingDetailsCard({
  plan,
  status,
  currentPeriodEndsAt,
  cancelAtPeriodEnd = false,
  currency,
  nextInvoiceAmount,
  paymentMethodBrand,
  paymentMethodLast4,
  canManage = false,
  isOpeningPortal = false,
  onManage,
}: BillingDetailsCardProps) {
  const { t, i18n } = useTranslation("subscription");
  const locale = i18n.resolvedLanguage?.toLowerCase().startsWith("pt-br") ? "pt-BR" : "en-US";
  const periodEnd = currentPeriodEndsAt
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(currentPeriodEndsAt))
    : null;
  const nextAmount = currency && nextInvoiceAmount !== null && nextInvoiceAmount !== undefined
    ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(nextInvoiceAmount / 100)
    : null;
  const paymentMethod = paymentMethodBrand && paymentMethodLast4
    ? t("paymentMethodValue", { brand: paymentMethodBrand, last4: paymentMethodLast4 })
    : t("billingUnavailable");
  const isPastDue = status === "past_due";
  const isCanceled = status === "canceled";

  const renewalLabel = cancelAtPeriodEnd || isCanceled ? t("accessUntilLabel") : t("nextRenewalLabel");
  const renewalValue = periodEnd ?? t("billingUnavailable");

  return (
    <SectionCard
      className={`mt-10 rounded-3xl border bg-card p-6 shadow-sm sm:p-8 ${
        isPastDue ? "border-amber-500/40" : "border-border"
      }`}
      icon={isPastDue ? AlertTriangle : ReceiptText}
      title={t("billingDetailsTitle")}
      titleClassName="text-xl font-black"
      description={t("billingDetailsDescription")}
      action={(
        <div className="hidden items-center gap-2 sm:flex">
          <Button
            type="button"
            onClick={onManage}
            disabled={!canManage || !onManage || isOpeningPortal}
          >
            {isOpeningPortal ? t("openingBillingPortal") : t("manageSubscription")}
            <ExternalLink className="size-4" aria-hidden="true" />
          </Button>
          <Tooltip
            label={t("billingPortalInformation")}
            content={canManage ? t("stripePortalNote") : t("ownerOnly")}
          >
            <Info className="size-4" aria-hidden="true" />
          </Tooltip>
        </div>
      )}
    >
      {(isPastDue || cancelAtPeriodEnd) && (
        <p className={`mt-5 max-w-2xl rounded-xl px-4 py-3 text-sm ${
          isPastDue
            ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
            : "bg-muted text-muted-foreground"
        }`}>
          {isPastDue
            ? t("pastDueNotice")
            : t("cancellationScheduledNotice", { date: renewalValue })}
        </p>
      )}

      <dl className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{t("statusTitle")}</dt>
          <dd className="mt-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyles[status]}`}>
              {t(`subscriptionStatuses.${status}`)}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{t("selectedPlanLabel")}</dt>
          <dd className="mt-2 text-sm font-bold">{t(`plans.${plan}.name`)}</dd>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{renewalLabel}</dt>
          <dd className="mt-2 text-sm font-bold">{renewalValue}</dd>
          {nextAmount && !cancelAtPeriodEnd && !isCanceled && (
            <p className="mt-1 text-xs text-muted-foreground">{t("nextInvoiceAmount", { amount: nextAmount })}</p>
          )}
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{t("paymentMethodLabel")}</dt>
          <dd className="mt-2 text-sm font-bold capitalize">{paymentMethod}</dd>
        </div>
      </dl>
      <div className="mt-6 sm:hidden">
        <Button
          type="button"
          className="w-full"
          onClick={onManage}
          disabled={!canManage || !onManage || isOpeningPortal}
        >
          {isOpeningPortal ? t("openingBillingPortal") : t("manageSubscription")}
          <ExternalLink className="size-4" aria-hidden="true" />
        </Button>
        <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
          {canManage ? t("stripePortalNote") : t("ownerOnly")}
        </p>
      </div>
    </SectionCard>
  );
}
