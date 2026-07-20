import { useTranslation } from "react-i18next";
import { SubscriptionSummary } from "../components/subscription-summary";

export function SubscriptionPage() {
  const { t } = useTranslation("subscription");

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight">{t("pageTitle")}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{t("pageDescription")}</p>
      <SubscriptionSummary />
    </section>
  );
}
