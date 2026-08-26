import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { mergeChannelLookup } from "@/features/channels/lib/channel-lookup";
import {
  useGetChannelsQuery,
  useLookupChannelsQuery,
} from "@/features/channels/services/channels-api";
import { useGetPublicationsQuery } from "@/features/posts/services/posts-api";
import { ROUTES } from "@/routes/route-paths";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { DashboardMetrics } from "../components/dashboard-metrics";
import { UpcomingPublications } from "../components/upcoming-publications";
import { getDashboardSummary, getUpcomingPublications } from "../lib/selectors";

export function DashboardPage() {
  const { t, i18n } = useTranslation("dashboard");
  const navigate = useNavigate();
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
  const query = (status: "draft" | "scheduled" | "failed") => ({
    workspaceId: workspace?.id ?? "",
    page: 1 as const,
    pageSize: 10 as const,
    status,
  });
  const { data: drafts } = useGetPublicationsQuery(query("draft"), {
    skip: !workspace,
  });
  const { data: scheduled } = useGetPublicationsQuery(query("scheduled"), {
    skip: !workspace,
  });
  const { data: failed } = useGetPublicationsQuery(query("failed"), {
    skip: !workspace,
  });
  const upcoming = getUpcomingPublications(scheduled?.items ?? []);
  const targetIds = Array.from(
    new Set(
      upcoming.flatMap((publication) =>
        publication.targets.map((target) => target.channelId)
      )
    )
  );
  const { data: channelPage } = useGetChannelsQuery(
    { workspaceId: workspace?.id ?? "", page: 1, pageSize: 10 },
    { skip: !workspace }
  );
  const { data: channelLookup } = useLookupChannelsQuery(
    {
      workspaceId: workspace?.id ?? "",
      limit: 20,
      includeIds: targetIds,
    },
    { skip: !workspace }
  );
  const channels = mergeChannelLookup(channelLookup);
  const summary = getDashboardSummary(undefined, channelPage?.summary.total, {
    drafts: drafts?.total ?? 0,
    scheduled: scheduled?.total ?? 0,
    failed: failed?.total ?? 0,
  });
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
    navigate(`${ROUTES.posts}?status=${status}`);
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
