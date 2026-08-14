import { Plus, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";

export function DashboardEmptyNotices({
  canManage,
  hasChannels,
  hasPublications,
}: {
  canManage: boolean;
  hasChannels: boolean;
  hasPublications: boolean;
}) {
  const { t } = useTranslation("dashboard");
  if (hasChannels && hasPublications) return null;
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {!hasChannels && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-5">
          <Radio className="size-5 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-bold">{t("empty.channelsTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("empty.channelsDescription")}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
            to={ROUTES.workspaceChannels}
          >
            {t("empty.channelsAction")}
          </Link>
        </div>
      )}
      {!hasPublications && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-5">
          <Plus className="size-5 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-bold">{t("empty.postsTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("empty.postsDescription")}
          </p>
          {canManage && (
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
              to={ROUTES.newPost}
            >
              {t("empty.postsAction")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
