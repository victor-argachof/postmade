import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeaturePlaceholder } from "@/shared/components/feature-placeholder";

export function PostsPage() {
  const { t } = useTranslation(["posts", "navigation"]);
  return <FeaturePlaceholder title={t("posts", { ns: "navigation" })} description={t("comingSoonDescription", { ns: "posts" })} icon={Send} />;
}
