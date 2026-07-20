import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeaturePlaceholder } from "@/shared/components/feature-placeholder";

export function CalendarPage() {
  const { t } = useTranslation(["calendar", "navigation", "common"]);
  return <FeaturePlaceholder title={t("calendar", { ns: "navigation" })} eyebrow={t("comingSoon", { ns: "common" })} description={t("comingSoonDescription", { ns: "calendar" })} icon={CalendarDays} />;
}
