import { useTranslation } from "react-i18next";
import { WorkspaceSettings } from "../components/workspace-settings";
import { PageHeader } from "@/shared/components/page-header";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function WorkspaceSettingsPage() {
  const { t } = useTranslation("workspaces");
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#workspace-members") return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("workspace-members")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

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
