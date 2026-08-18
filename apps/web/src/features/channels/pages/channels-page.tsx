import type { SocialChannel, SocialPlatform } from "@postmade/types";
import { LockKeyhole, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { getWorkspaceChannelLimit } from "@/features/workspaces/lib/workspace-limits";
import { disconnectWorkspaceChannel } from "@/features/workspaces/store/workspaces-slice";
import { ROUTES } from "@/routes/route-paths";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { ChannelUsage } from "../components/channel-usage";
import { ConnectedChannels } from "../components/connected-channels";
import { DisconnectChannelModal } from "../components/disconnect-channel-modal";
import { PlatformGrid } from "../components/platform-grid";
import { useGetOAuthUrlMutation } from "../services/channels-api";

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const [getOAuthUrl] = useGetOAuthUrlMutation();
  const [connectingPlatforms, setConnectingPlatforms] = useState<
    Set<SocialPlatform>
  >(new Set());
  const [channelToDisconnect, setChannelToDisconnect] =
    useState<SocialChannel | null>(null);

  const channels =
    workspace?.resources.channels.filter((channel) => channel.connected) ?? [];
  const member = workspace?.members.find((item) => item.id === user?.id);
  const canManage = member?.role === "owner" || member?.role === "admin";
  const limit = workspace
    ? getWorkspaceChannelLimit(
        workspace.subscriptionConfiguration,
        workspace.subscriptionStatus
      )
    : 0;
  const limitReached = limit !== null && channels.length >= limit;
  const counts = channels.reduce<Record<SocialPlatform, number>>(
    (result, channel) => ({
      ...result,
      [channel.platform]: result[channel.platform] + 1,
    }),
    { ...emptyCounts }
  );

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
      const { url } = await getOAuthUrl({
        workspaceId: workspace.id,
        platform,
      }).unwrap();
      window.location.assign(url);
    } catch {
      toast.error(
        t("feedback.connectError", {
          platform: t(`platforms.${platform}.name`),
        })
      );
    } finally {
      setConnectingPlatforms((current) => {
        const next = new Set(current);
        next.delete(platform);
        return next;
      });
    }
  };

  const confirmDisconnect = () => {
    if (!workspace || !user || !channelToDisconnect || !canManage) return;
    dispatch(
      disconnectWorkspaceChannel({
        workspaceId: workspace.id,
        channelId: channelToDisconnect.id,
        actorId: user.id,
      })
    );
    toast.success(
      t("feedback.disconnectSuccess", {
        name: channelToDisconnect.displayName,
      })
    );
    setChannelToDisconnect(null);
  };

  return (
    <section className="mx-auto max-w-6xl">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <ChannelUsage connected={channels.length} limit={limit} />

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
      <ConnectedChannels
        key={workspace?.id}
        channels={channels}
        canManage={canManage}
        onDisconnect={setChannelToDisconnect}
      />
      <DisconnectChannelModal
        channel={channelToDisconnect}
        onClose={() => setChannelToDisconnect(null)}
        onConfirm={confirmDisconnect}
      />
    </section>
  );
}
