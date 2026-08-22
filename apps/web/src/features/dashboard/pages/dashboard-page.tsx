import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { setPublicationFilters } from "@/features/posts/store/posts-slice";
import { ROUTES } from "@/routes/route-paths";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { DashboardMetrics } from "../components/dashboard-metrics";
import { UpcomingPublications } from "../components/upcoming-publications";
import { getDashboardSummary, getUpcomingPublications } from "../lib/selectors";

export function DashboardPage() {
  const { t, i18n } = useTranslation("dashboard");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const user = useAppSelector((state) => state.auth.user);
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const canManage = Boolean(role && role !== "viewer");
  const summary = getDashboardSummary(workspace);
  const upcoming = getUpcomingPublications(workspace);
  const channels = workspace?.resources.channels ?? [];
  const firstName = user?.name.trim().split(/\s+/)[0];

  const selectMetric = (
    metric: "channels" | "drafts" | "scheduled" | "failed"
  ) => {
    if (metric === "channels") {
      navigate(ROUTES.workspaceChannels);
      return;
    }
    const status =
      metric === "drafts"
        ? "draft"
        : metric === "scheduled"
          ? "scheduled"
          : "failed";
    dispatch(
      setPublicationFilters({
        query: "",
        status,
        platform: "all",
        channelId: "all",
        from: "",
        to: "",
      })
    );
    navigate(ROUTES.posts);
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow={firstName ? t("greeting", { name: firstName }) : undefined}
          title={t("title")}
          description={t("description")}
        />
        {canManage && (
          <Button onClick={() => navigate(ROUTES.newPost)}>
            <Plus className="size-4" aria-hidden="true" />
            {t("newPost")}
          </Button>
        )}
      </div>
      <DashboardMetrics summary={summary} onSelect={selectMetric} />
      <div className="mt-5">
        <UpcomingPublications
          channels={channels}
          locale={i18n.language}
          publications={upcoming}
          timezone={workspace?.timezone ?? "UTC"}
        />
      </div>
    </section>
  );
}
