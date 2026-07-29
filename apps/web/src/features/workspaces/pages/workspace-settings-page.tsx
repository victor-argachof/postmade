import { useTranslation } from "react-i18next";
import { WorkspaceSettings } from "../components/workspace-settings";
import { PageHeader } from "@/shared/components/page-header";

export function WorkspaceSettingsPage() {
  const { t } = useTranslation("workspaces");

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />
      <WorkspaceSettings />
    </section>
  );
}
