import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeaturePlaceholder } from "@/shared/components/feature-placeholder";

export function CalendarPage() {
  const { t } = useTranslation(["calendar", "navigation"]);
  return <FeaturePlaceholder title={t("calendar", { ns: "navigation" })} description={t("comingSoonDescription", { ns: "calendar" })} icon={CalendarDays} />;
}
