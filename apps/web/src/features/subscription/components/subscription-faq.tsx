import { useTranslation } from "react-i18next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

const questions = [
  "pricing",
  "trial",
  "memberUsage",
  "changeSubscription",
  "reduceQuantities",
] as const;

export function SubscriptionFaq() {
  const { t } = useTranslation("subscription");

  return (
    <section className="mt-16" aria-labelledby="subscription-faq-title">
      <div className="max-w-2xl">
        <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">
          {t("faq.eyebrow")}
        </p>
        <h2
          id="subscription-faq-title"
          className="mt-3 text-3xl font-black tracking-tight"
        >
          {t("faq.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("faq.description")}
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="mt-8 rounded-3xl border border-border bg-card px-6 py-3 sm:px-8 sm:py-4"
      >
        {questions.map((question) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger>
              {t(`faq.items.${question}.question`)}
            </AccordionTrigger>
            <AccordionContent>
              {t(`faq.items.${question}.answer`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
