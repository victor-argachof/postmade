import type { SocialChannel, SocialPlatform } from "@postmade/types";
import { LockKeyhole, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { getWorkspaceChannelLimit } from "@/features/workspaces/lib/workspace-limits";
import { ROUTES } from "@/routes/route-paths";
import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { ChannelUsage } from "../components/channel-usage";
import type { PlatformFilter } from "../components/channels-filters";
import { ConnectedChannels } from "../components/connected-channels";
import { DisconnectChannelModal } from "../components/disconnect-channel-modal";
import { PlatformGrid } from "../components/platform-grid";
import {
  useDisconnectChannelMutation,
  useGetChannelsQuery,
  useStartChannelOAuthMutation,
} from "../services/channels-api";

const emptyCounts: Record<SocialPlatform, number> = {
  facebook: 0,
  linkedin: 0,
  instagram: 0,
  tiktok: 0,
  youtube: 0,
};

export function ChannelsPage() {
  const workspaceId = useAppSelector(
    (state) => state.workspaces.activeWorkspaceId
  );
  return <ChannelsPageContent key={workspaceId ?? "no-workspace"} />;
}

function ChannelsPageContent() {
  const { t } = useTranslation("channels");
  const { t: tApiError } = useTranslation("apiErrors");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const rawPageSize = Number(searchParams.get("pageSize"));
  const pageSize = [10, 25, 50].includes(rawPageSize) ? rawPageSize : 10;
  const query = searchParams.get("query") ?? "";
  const platformParam = searchParams.get("platform");
  const platform: PlatformFilter = Object.hasOwn(
    emptyCounts,
    platformParam ?? ""
  )
    ? (platformParam as SocialPlatform)
    : "all";
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);
  const { data, error, isError, isFetching, isLoading, refetch } =
    useGetChannelsQuery(
      {
        workspaceId: workspace?.id ?? "",
        page,
        pageSize: pageSize as 10 | 25 | 50,
        query: debouncedQuery || undefined,
        platform: platform === "all" ? undefined : platform,
      },
      { skip: !workspace }
    );
  const [startOAuth] = useStartChannelOAuthMutation();
  const [disconnectChannel, { isLoading: isDisconnecting }] =
    useDisconnectChannelMutation();
  const [connectingPlatforms, setConnectingPlatforms] = useState<
    Set<SocialPlatform>
  >(new Set());
  const [channelToDisconnect, setChannelToDisconnect] =
    useState<SocialChannel | null>(null);

  const channels = data?.items ?? [];
  const member = workspace?.members.find((item) => item.id === user?.id);
  const canManage = member?.role === "owner" || member?.role === "admin";
  const limit = workspace
    ? getWorkspaceChannelLimit(
        workspace.subscriptionConfiguration,
        workspace.subscriptionStatus
      )
    : 0;
  const connectedCount = data?.summary.total ?? 0;
  const limitReached = limit !== null && connectedCount >= limit;
  const counts = data?.summary.byPlatform ?? emptyCounts;

  const updateParams = (
    values: Record<string, string | number | undefined>
  ) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values))
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const result = searchParams.get("channelConnection");
    if (!result) return;
    if (result === "success") toast.success(t("feedback.connectSuccess"));
    else {
      const code = searchParams.get("code") ?? "INTERNAL_ERROR";
      toast.error(
        tApiError(
          getApiErrorTranslationKey({ statusCode: 400, code, message: code })
        )
      );
    }
    const next = new URLSearchParams(searchParams);
    next.delete("channelConnection");
    next.delete("platform");
    next.delete("code");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, t, tApiError]);

  const connect = async (platform: SocialPlatform) => {
    if (
      !workspace ||
      !canManage ||
      limitReached ||
      connectingPlatforms.has(platform)
    )
      return;
    setConnectingPlatforms((current) => new Set(current).add(platform));
    try {
      const { url } = await startOAuth({
        workspaceId: workspace.id,
        platform,
      }).unwrap();
      window.location.assign(url);
    } catch (error) {
      toast.error(tApiError(getApiErrorTranslationKey(error)));
    } finally {
      setConnectingPlatforms((current) => {
        const next = new Set(current);
        next.delete(platform);
        return next;
      });
    }
  };

  const confirmDisconnect = async () => {
    if (!workspace || !channelToDisconnect || !canManage) return;
    try {
      await disconnectChannel({
        workspaceId: workspace.id,
        channelId: channelToDisconnect.id,
      }).unwrap();
      toast.success(
        t("feedback.disconnectSuccess", {
          name: channelToDisconnect.displayName,
        })
      );
      setChannelToDisconnect(null);
    } catch (error) {
      toast.error(tApiError(getApiErrorTranslationKey(error)));
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <ChannelUsage connected={connectedCount} limit={limit} />

      {import.meta.env.DEV && (
        <p className="mt-4 text-xs text-muted-foreground" role="note">
          {t("mockNotice")}
        </p>
      )}

      {limitReached && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center">
          <TriangleAlert
            className="size-5 shrink-0 text-amber-700 dark:text-amber-400"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="font-bold">{t("limit.title")}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("limit.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.workspaceSubscription)}
          >
            {t("limit.action")}
          </Button>
        </div>
      )}

      {!canManage && workspace && (
        <p className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("permissions.readOnly")}
        </p>
      )}

      <PlatformGrid
        counts={counts}
        connectingPlatforms={connectingPlatforms}
        disabled={!workspace || !canManage || limitReached}
        onConnect={(platform) => void connect(platform)}
      />
      {isLoading ? (
        <p className="mt-12 text-sm text-muted-foreground" role="status">
          {t("loading")}
        </p>
      ) : (
        <ConnectedChannels
          key={workspace?.id}
          channels={channels}
          canManage={canManage}
          error={
            isError
              ? {
                  message: tApiError(getApiErrorTranslationKey(error)),
                  onRetry: () => void refetch(),
                }
              : undefined
          }
          onClear={() =>
            updateParams({ query: undefined, platform: undefined, page: 1 })
          }
          onDisconnect={setChannelToDisconnect}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
          onPageSizeChange={(size) => updateParams({ pageSize: size, page: 1 })}
          onPlatformChange={(value) =>
            updateParams({
              platform: value === "all" ? undefined : value,
              page: 1,
            })
          }
          onQueryChange={(value) => updateParams({ query: value, page: 1 })}
          page={data?.page ?? page}
          pageSize={data?.pageSize ?? pageSize}
          platform={platform}
          query={query}
          totalResults={data?.total ?? 0}
        />
      )}
      {isFetching && !isLoading && (
        <span className="sr-only" role="status">
          {t("loading")}
        </span>
      )}
      <DisconnectChannelModal
        channel={channelToDisconnect}
        onClose={() => setChannelToDisconnect(null)}
        onConfirm={confirmDisconnect}
        disconnecting={isDisconnecting}
      />
    </section>
  );
}
