import { ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionCard } from "@/shared/components/section-card";

interface TrialDetailsCardProps {
  remainingDays: number;
  totalDays: number;
  trialEndsAt?: string | null;
}

export function TrialDetailsCard({
  remainingDays,
  totalDays,
  trialEndsAt,
}: TrialDetailsCardProps) {
  const { t, i18n } = useTranslation("subscription");
  const locale = i18n.resolvedLanguage?.toLowerCase().startsWith("pt-br") ? "pt-BR" : "en-US";
  const safeTotalDays = Math.max(totalDays, 0);
  const safeRemainingDays = Math.min(Math.max(remainingDays, 0), safeTotalDays);
  const endDate = trialEndsAt
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(trialEndsAt))
    : t("billingUnavailable");

  return (
    <SectionCard
      className="mt-10"
      icon={ReceiptText}
      title={t("billingDetailsTitle")}
      description={t("billingDetailsDescription")}
    >
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{t("statusTitle")}</dt>
          <dd className="mt-2">
            <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
              {t("subscriptionStatuses.trialing")}
            </span>
          </dd>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{t("progressLabel")}</dt>
          <dd className="mt-2 text-sm font-bold">
            {t("daysUsage", { remaining: safeRemainingDays, total: safeTotalDays })}
          </dd>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{t("trialEndLabel")}</dt>
          <dd className="mt-2 text-sm font-bold">{endDate}</dd>
        </div>
      </dl>
    </SectionCard>
  );
}
