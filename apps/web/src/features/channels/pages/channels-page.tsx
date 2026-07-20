import { Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeaturePlaceholder } from "@/shared/components/feature-placeholder";

export function ChannelsPage() {
  const { t } = useTranslation(["channels", "navigation", "common"]);
  return <FeaturePlaceholder title={t("channels", { ns: "navigation" })} eyebrow={t("comingSoon", { ns: "common" })} description={t("comingSoonDescription", { ns: "channels" })} icon={Radio} />;
}
