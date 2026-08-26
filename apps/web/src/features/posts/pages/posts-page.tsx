import type { ScheduledPublication, SocialPlatform } from "@postmade/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { mergeChannelLookup } from "@/features/channels/lib/channel-lookup";
import { useLookupChannelsQuery } from "@/features/channels/services/channels-api";
import { ROUTES } from "@/routes/route-paths";
import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { CancelScheduleModal } from "../components/overlays/cancel-schedule-modal";
import { DeletePublicationModal } from "../components/overlays/delete-publication-modal";
import { DuplicatePublicationModal } from "../components/overlays/duplicate-publication-modal";
import { PostsDataTable } from "../components/posts-data-table";
import { PostsFilters } from "../components/posts-filters";
import { PostsViewSwitcher } from "../components/posts-view-switcher";
import {
  useCancelPublicationMutation,
  useDeletePublicationMutation,
  useDuplicatePublicationMutation,
  useGetPublicationsQuery,
  useRetryPublicationMutation,
} from "../services/posts-api";
import type { PublicationFilters } from "../types";

export function PostsPage() {
  const { t, i18n } = useTranslation("posts");
  const { t: tApiError } = useTranslation("apiErrors");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const user = useAppSelector((state) => state.auth.user);
  const filters: PublicationFilters = {
    query: params.get("query") ?? "",
    status: (params.get("status") as PublicationFilters["status"]) ?? "all",
    platform:
      (params.get("platform") as PublicationFilters["platform"]) ?? "all",
    channelId: params.get("channelId") ?? "all",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };
  const page = Math.max(1, Number(params.get("page")) || 1);
  const rawPageSize = Number(params.get("pageSize"));
  const pageSize = ([10, 25, 50].includes(rawPageSize) ? rawPageSize : 10) as
    10 | 25 | 50;
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(filters.query),
      300
    );
    return () => window.clearTimeout(timeout);
  }, [filters.query]);
  const { data, error, isError, isLoading, refetch } = useGetPublicationsQuery(
    {
      workspaceId: workspace?.id ?? "",
      page,
      pageSize,
      query: debouncedQuery || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      platform:
        filters.platform === "all"
          ? undefined
          : (filters.platform as SocialPlatform),
      channelId: filters.channelId === "all" ? undefined : filters.channelId,
      from: filters.from
        ? new Date(`${filters.from}T00:00:00`).toISOString()
        : undefined,
      to: filters.to
        ? new Date(`${filters.to}T23:59:59`).toISOString()
        : undefined,
    },
    { skip: !workspace }
  );
  const channelIds = Array.from(
    new Set(
      (data?.items ?? []).flatMap((post) =>
        post.targets.map((target) => target.channelId)
      )
    )
  );
  const { data: lookup } = useLookupChannelsQuery(
    { workspaceId: workspace?.id ?? "", limit: 30, includeIds: channelIds },
    { skip: !workspace }
  );
  const channels = mergeChannelLookup(lookup);
  const [duplicate] = useDuplicatePublicationMutation();
  const [cancel] = useCancelPublicationMutation();
  const [remove] = useDeletePublicationMutation();
  const [retry] = useRetryPublicationMutation();
  const [duplicating, setDuplicating] = useState<ScheduledPublication | null>(
    null
  );
  const [canceling, setCanceling] = useState<ScheduledPublication | null>(null);
  const [deleting, setDeleting] = useState<ScheduledPublication | null>(null);
  const canManage =
    workspace?.members.find((member) => member.id === user?.id)?.role !==
    "viewer";
  const updateParams = (
    values: Record<string, string | number | undefined>
  ) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values))
      if (!value || value === "all") next.delete(key);
      else next.set(key, String(value));
    setParams(next, { replace: true });
  };
  const execute = async (
    type: "delete" | "cancel" | "duplicate" | "retry",
    id: string
  ) => {
    if (!workspace) return;
    try {
      const input = { workspaceId: workspace.id, publicationId: id };
      if (type === "delete") await remove(input).unwrap();
      if (type === "cancel") await cancel(input).unwrap();
      if (type === "duplicate") await duplicate(input).unwrap();
      if (type === "retry") await retry(input).unwrap();
      toast.success(t(`feedback.${type}`));
    } catch (requestError) {
      toast.error(tApiError(getApiErrorTranslationKey(requestError)));
    }
  };
  const requestAction = (
    type: "delete" | "cancel" | "duplicate" | "retry",
    id: string
  ) => {
    const publication = data?.items.find((post) => post.id === id);
    if (!publication) return;
    if (type === "duplicate") setDuplicating(publication);
    else if (type === "cancel") setCanceling(publication);
    else if (type === "delete") setDeleting(publication);
    else void execute(type, id);
  };
  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        {canManage && (
          <Button onClick={() => navigate(ROUTES.newPost)}>
            <Plus className="size-4" />
            {t("newPost")}
          </Button>
        )}
      </div>
      <PostsViewSwitcher />
      <PostsFilters
        channels={channels}
        filters={filters}
        onChange={(change) => updateParams({ ...change, page: 1 })}
      />
      {isLoading ? (
        <p className="mt-12 text-sm text-muted-foreground" role="status">
          {t("loading")}
        </p>
      ) : isError ? (
        <div className="mt-8">
          <p>{tApiError(getApiErrorTranslationKey(error))}</p>
          <Button className="mt-3" onClick={() => void refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : (
        <PostsDataTable
          canManage={Boolean(canManage)}
          channels={channels}
          empty={
            <div className="p-12 text-center">
              <p className="font-bold">{t("empty.title")}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
          }
          locale={i18n.language}
          onAction={requestAction}
          onEdit={(id) => navigate(ROUTES.editPost(id))}
          publications={data?.items ?? []}
          timezone={workspace?.timezone ?? "UTC"}
          remotePagination={{
            page,
            pageSize,
            total: data?.total ?? 0,
            onPageChange: (value) => updateParams({ page: value }),
            onPageSizeChange: (value) =>
              updateParams({ pageSize: value, page: 1 }),
          }}
        />
      )}
      <DuplicatePublicationModal
        publication={duplicating}
        onClose={() => setDuplicating(null)}
        onConfirm={() => {
          if (duplicating) void execute("duplicate", duplicating.id);
          setDuplicating(null);
        }}
      />
      <CancelScheduleModal
        publication={canceling}
        onClose={() => setCanceling(null)}
        onConfirm={() => {
          if (canceling) void execute("cancel", canceling.id);
          setCanceling(null);
        }}
      />
      <DeletePublicationModal
        publication={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void execute("delete", deleting.id);
          setDeleting(null);
        }}
      />
    </section>
  );
}
