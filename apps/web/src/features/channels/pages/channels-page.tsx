import { Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeaturePlaceholder } from "@/shared/components/feature-placeholder";

export function ChannelsPage() {
  const { t } = useTranslation(["channels", "navigation"]);
  return <FeaturePlaceholder title={t("channels", { ns: "navigation" })} description={t("comingSoonDescription", { ns: "channels" })} icon={Radio} />;
}
