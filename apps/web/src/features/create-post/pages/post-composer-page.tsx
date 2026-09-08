import type {
  PublicationInput,
  PublicationMedia,
  PublicationStatus,
  PublicationTagGroupSnapshot,
  PublicationTargetInput,
  ScheduledPublication,
  SocialPlatform,
} from "@postmade/types";
import { ArrowLeft, Clock3, Save, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { mergeChannelLookup } from "@/features/channels/lib/channel-lookup";
import { useLookupChannelsQuery } from "@/features/channels/services/channels-api";
import { selectActiveWorkspace } from "@/features/posts/lib/selectors";
import {
  useCreatePublicationMutation,
  useGetPublicationQuery,
  useGetPublicationsQuery,
  useUpdatePublicationMutation,
} from "@/features/posts/services/posts-api";
import { effectivePublicationContent } from "@/features/tags/lib/tags";
import { WORKSPACE_TRIAL_LIMITS } from "@/features/workspaces/lib/workspace-limits";
import { ROUTES } from "@/routes/route-paths";
import { getApiError, getApiErrorTranslationKey } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { PublicationConfirmationModal } from "../components/overlays/publication-confirmation-modal";
import { PlatformPreview } from "../components/platform-preview";
import type { PublicationTimingMode } from "../components/publication-timing-switcher";
import { ChannelsStep } from "../components/steps/channels-step";
import { ContentStep } from "../components/steps/content-step";
import { PersonalizationStep } from "../components/steps/personalization-step";
import { SchedulingStep } from "../components/steps/scheduling-step";
import { utcToZonedInput, zonedInputToUtc } from "../lib/dates";
import { validateTarget } from "../lib/platform-rules";

export function PostComposerPage() {
  const { publicationId } = useParams();
  const workspace = useAppSelector(selectActiveWorkspace);
  const { data, error, isError, isLoading, refetch } = useGetPublicationQuery(
    { workspaceId: workspace?.id ?? "", publicationId: publicationId ?? "" },
    { skip: !workspace || !publicationId }
  );
  const { t } = useTranslation("createPost");
  const { t: tApiError } = useTranslation("apiErrors");
  if (publicationId && isLoading)
    return (
      <p
        className="mx-auto max-w-6xl text-sm text-muted-foreground"
        role="status"
      >
        {t("composer.loading")}
      </p>
    );
  if (publicationId && isError)
    return (
      <div className="mx-auto max-w-6xl">
        <p>{tApiError(getApiErrorTranslationKey(error))}</p>
        <Button className="mt-3" onClick={() => void refetch()}>
          {t("composer.retry")}
        </Button>
      </div>
    );
  if (publicationId && !data) return null;
  return (
    <PostComposerContent
      key={`${workspace?.id}-${publicationId ?? "new"}`}
      existing={data}
    />
  );
}

function PostComposerContent({
  existing,
}: {
  existing?: ScheduledPublication;
}) {
  const { t, i18n } = useTranslation("createPost");
  const { t: tApiError } = useTranslation("apiErrors");

  const publicationErrorMessage = (error: unknown) => {
    const detail = getApiError(error)?.details?.[0];
    if (!detail) return tApiError(getApiErrorTranslationKey(error));
    if (detail.code === "MEDIA_REQUIRED")
      return t("composer.validation.mediaRequired");
    if (detail.code === "MEDIA_TYPE_NOT_SUPPORTED")
      return t("composer.validation.mediaType");
    if (detail.code === "TOO_LONG") return t("composer.validation.characters");
    if (detail.code === "TOO_MANY" && detail.field.includes("media"))
      return t("composer.validation.mediaCount");
    if (detail.code === "REQUIRED" && detail.field.includes("content"))
      return t("composer.validation.empty");
    if (detail.code === "MEDIA_NOT_READY")
      return t("composer.validation.mediaPending");
    return tApiError(getApiErrorTranslationKey(error));
  };
  const navigate = useNavigate();
  const openTagsManager = () => {
    window.open(ROUTES.tags, "_blank", "noopener,noreferrer");
  };
  const openChannelsManager = () => {
    window.open(ROUTES.workspaceChannels, "_blank", "noopener,noreferrer");
  };
  const [search] = useSearchParams();
  const workspace = useAppSelector(selectActiveWorkspace);
  const user = useAppSelector((state) => state.auth.user);
  const [createPublication, { isLoading: isCreating }] =
    useCreatePublicationMutation();
  const [updatePublication, { isLoading: isUpdating }] =
    useUpdatePublicationMutation();
  const { data: trialPublications } = useGetPublicationsQuery(
    { workspaceId: workspace?.id ?? "", page: 1, pageSize: 50 },
    { skip: !workspace || workspace.subscriptionStatus !== "trialing" }
  );
  const [content, setContent] = useState(existing?.content ?? "");
  const [composerNow] = useState(() => Date.now());
  const [media, setMedia] = useState<PublicationMedia[]>(existing?.media ?? []);
  const [channelIds, setChannelIds] = useState<string[]>(
    existing?.targets.map((target) => target.channelId) ?? []
  );
  const [overrides, setOverrides] = useState<
    Partial<Record<SocialPlatform, string>>
  >(
    () =>
      existing?.targets.reduce<Partial<Record<SocialPlatform, string>>>(
        (current, target) => {
          if (!(target.platform in current) || target.contentOverride) {
            current[target.platform] = target.contentOverride ?? "";
          }
          return current;
        },
        {}
      ) ?? {}
  );
  const [tagGroupOverrides, setTagGroupOverrides] = useState<
    Partial<Record<SocialPlatform, PublicationTagGroupSnapshot[]>>
  >(
    () =>
      existing?.targets.reduce<
        Partial<Record<SocialPlatform, PublicationTagGroupSnapshot[]>>
      >((current, target) => {
        if (target.tagGroupSnapshotsOverride != null) {
          current[target.platform] = target.tagGroupSnapshotsOverride;
        }
        return current;
      }, {}) ?? {}
  );
  const [customizedPlatforms, setCustomizedPlatforms] = useState<
    SocialPlatform[]
  >(() =>
    Array.from(
      new Set(
        existing?.targets
          .filter(
            (target) =>
              target.contentOverride || target.tagGroupSnapshotsOverride != null
          )
          .map((target) => target.platform) ?? []
      )
    )
  );
  const defaultDate = search.get("date") ? `${search.get("date")}T09:00` : "";
  const [scheduledFor, setScheduledFor] = useState(
    existing?.scheduledFor && workspace
      ? utcToZonedInput(existing.scheduledFor, workspace.timezone)
      : defaultDate
  );
  const [timingMode, setTimingMode] = useState<PublicationTimingMode>(
    existing?.status === "scheduled" || defaultDate ? "scheduled" : "immediate"
  );
  const [tagGroupSnapshots, setTagGroupSnapshots] = useState<
    PublicationTagGroupSnapshot[]
  >(existing?.tagGroupSnapshots ?? []);
  const [confirmationMode, setConfirmationMode] = useState<
    "published" | "scheduled" | null
  >(null);
  const [previewChannel, setPreviewChannel] = useState(channelIds[0] ?? "");
  const { data: channelLookup } = useLookupChannelsQuery(
    {
      workspaceId: workspace?.id ?? "",
      limit: 30,
      includeIds: existing?.targets.map((target) => target.channelId),
    },
    { skip: !workspace }
  );
  const channels = mergeChannelLookup(channelLookup).filter(
    (channel) => channel.connectionStatus === "connected"
  );
  const selected = channels.filter((channel) =>
    channelIds.includes(channel.id)
  );
  const selectedPlatforms = Array.from(
    new Set(selected.map((channel) => channel.platform))
  );
  const activeCustomizedPlatforms =
    selectedPlatforms.length > 1
      ? customizedPlatforms.filter((platform) =>
          selectedPlatforms.includes(platform)
        )
      : [];
  const effectiveContent = effectivePublicationContent(
    content,
    tagGroupSnapshots
  );
  const errors = selected.flatMap((channel) =>
    validateTarget(
      channel.platform,
      effectivePublicationContent(
        activeCustomizedPlatforms.includes(channel.platform)
          ? overrides[channel.platform]?.trim() || content
          : content,
        activeCustomizedPlatforms.includes(channel.platform)
          ? (tagGroupOverrides[channel.platform] ?? tagGroupSnapshots)
          : tagGroupSnapshots
      ),
      media
    ).map((error) => ({ channel, error }))
  );
  const used =
    trialPublications?.items.filter(
      (post) => post.status !== "draft" && post.id !== existing?.id
    ).length ?? 0;
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const readOnly =
    !role ||
    role === "viewer" ||
    existing?.status === "published" ||
    existing?.status === "publishing";
  const minimumSchedule = utcToZonedInput(
    new Date(composerNow + 5 * 60 * 1000).toISOString(),
    workspace?.timezone ?? "UTC"
  );
  const maximumSchedule = utcToZonedInput(
    new Date(composerNow + 90 * 24 * 60 * 60 * 1000).toISOString(),
    workspace?.timezone ?? "UTC"
  );
  const mediaBusy = media.some(
    (item) => item.status && item.status !== "ready"
  );
  const changeTimingMode = (mode: PublicationTimingMode) => {
    setTimingMode(mode);
    if (mode === "scheduled" && !scheduledFor) {
      setScheduledFor(minimumSchedule);
    }
  };

  const validateSubmission = (status: PublicationStatus) => {
    if (!workspace || !user || readOnly) return;
    if (channelIds.length === 0 || errors.length > 0) {
      toast.error(t("composer.validation.fix"));
      return false;
    }
    if (
      status === "scheduled" &&
      (!scheduledFor ||
        zonedInputToUtc(scheduledFor, workspace.timezone) <
          new Date(composerNow + 5 * 60 * 1000).toISOString() ||
        zonedInputToUtc(scheduledFor, workspace.timezone) >
          new Date(composerNow + 90 * 24 * 60 * 60 * 1000).toISOString())
    ) {
      toast.error(t("composer.validation.future"));
      return false;
    }
    if (
      status !== "draft" &&
      workspace.subscriptionStatus === "trialing" &&
      used >= WORKSPACE_TRIAL_LIMITS.posts
    ) {
      toast.error(t("composer.validation.trial"));
      return false;
    }
    return true;
  };
  const save = async (
    status: "draft" | "scheduled" | "published",
    validated = false
  ) => {
    if (!workspace || !user || readOnly) return;
    if (status !== "draft" && !validated && !validateSubmission(status)) return;
    const publication: PublicationInput = {
      status,
      content: content.trim(),
      targets: selected.map((channel): PublicationTargetInput => ({
        channelId: channel.id,
        contentOverride: activeCustomizedPlatforms.includes(channel.platform)
          ? overrides[channel.platform]?.trim() || null
          : null,
        tagGroupSnapshotsOverride: activeCustomizedPlatforms.includes(
          channel.platform
        )
          ? (tagGroupOverrides[channel.platform] ?? tagGroupSnapshots)
          : null,
        settings:
          existing?.targets.find((target) => target.channelId === channel.id)
            ?.settings ?? {},
      })),
      tagGroupSnapshots,
      mediaIds: media.map((item) => item.id),
      scheduledFor:
        status === "scheduled"
          ? zonedInputToUtc(scheduledFor, workspace.timezone)
          : null,
    };
    try {
      if (existing)
        await updatePublication({
          workspaceId: workspace.id,
          publicationId: existing.id,
          publication,
        }).unwrap();
      else
        await createPublication({
          workspaceId: workspace.id,
          publication,
        }).unwrap();
      toast.success(t(`composer.feedback.${status}`));
      navigate(ROUTES.posts);
    } catch (error) {
      toast.error(publicationErrorMessage(error));
    }
  };
  const requestConfirmation = (status: "published" | "scheduled") => {
    if (validateSubmission(status)) setConfirmationMode(status);
  };
  const preview =
    selected.find((channel) => channel.id === previewChannel) ?? selected[0];
  return (
    <section className="mx-auto max-w-6xl">
      <button
        className="mb-5 flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => navigate(ROUTES.posts)}
      >
        <ArrowLeft className="size-4" />
        {t("composer.back")}
      </button>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">
            {existing ? t("composer.editTitle") : t("composer.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {workspace?.subscriptionStatus === "trialing" &&
            t("composer.trialUsage", {
              used,
              limit: WORKSPACE_TRIAL_LIMITS.posts,
            })}
        </p>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <div className="space-y-5">
          <ChannelsStep
            channels={channels}
            disabled={readOnly}
            onChange={setChannelIds}
            onManage={openChannelsManager}
            value={channelIds}
          />
          <ContentStep
            content={content}
            disabled={readOnly}
            effectiveContentLength={effectiveContent.length}
            media={media}
            onContentChange={setContent}
            onManageTags={openTagsManager}
            onMediaChange={setMedia}
            onTagGroupsChange={setTagGroupSnapshots}
            selectedPlatforms={selectedPlatforms}
            tagGroupSnapshots={tagGroupSnapshots}
            workspaceId={workspace?.id ?? ""}
          />
          <PersonalizationStep
            content={content}
            disabled={readOnly}
            enabledPlatforms={activeCustomizedPlatforms}
            errors={errors.map(({ channel, error }) => ({
              error,
              platform: channel.platform,
            }))}
            onEnabledPlatformsChange={setCustomizedPlatforms}
            onManageTags={openTagsManager}
            onOverridesChange={setOverrides}
            onTagGroupOverridesChange={setTagGroupOverrides}
            overrides={overrides}
            platforms={selectedPlatforms}
            tagGroupOverrides={tagGroupOverrides}
            tagGroupSnapshots={tagGroupSnapshots}
            workspaceId={workspace?.id ?? ""}
          />
          <SchedulingStep
            disabled={readOnly}
            maximumSchedule={maximumSchedule}
            minimumSchedule={minimumSchedule}
            onScheduledForChange={setScheduledFor}
            onTimingModeChange={changeTimingMode}
            scheduledFor={scheduledFor}
            timezone={workspace?.timezone ?? "UTC"}
            timingMode={timingMode}
          />
          {!readOnly && (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                disabled={isCreating || isUpdating || mediaBusy}
                variant="outline"
                onClick={() => save("draft")}
              >
                <Save className="size-4" />
                {t("composer.saveDraft")}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={
                  isCreating ||
                  isUpdating ||
                  mediaBusy ||
                  (timingMode === "scheduled" && !scheduledFor)
                }
                onClick={() =>
                  requestConfirmation(
                    timingMode === "scheduled" ? "scheduled" : "published"
                  )
                }
              >
                {timingMode === "scheduled" ? (
                  <Clock3 className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
                {t(
                  timingMode === "scheduled"
                    ? "composer.scheduleAction"
                    : "composer.publishNow"
                )}
              </Button>
            </div>
          )}
        </div>
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">{t("composer.preview")}</h2>
            {selected.length > 0 ? (
              <>
                <Select value={preview?.id} onValueChange={setPreviewChannel}>
                  <SelectTrigger
                    aria-label={t("composer.preview")}
                    className="mt-3 h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selected.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preview && (
                  <div className="mt-4">
                    <PlatformPreview
                      content={effectivePublicationContent(
                        activeCustomizedPlatforms.includes(preview.platform)
                          ? overrides[preview.platform]?.trim() || content
                          : content,
                        activeCustomizedPlatforms.includes(preview.platform)
                          ? (tagGroupOverrides[preview.platform] ??
                              tagGroupSnapshots)
                          : tagGroupSnapshots
                      )}
                      media={media}
                      platform={preview.platform}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("composer.previewNoChannel")}
              </p>
            )}
          </div>
        </aside>
      </div>
      <PublicationConfirmationModal
        channels={selected}
        content={effectiveContent}
        locale={i18n.language}
        mode={confirmationMode}
        onClose={() => setConfirmationMode(null)}
        onConfirm={() => {
          if (!confirmationMode) return;
          const status = confirmationMode;
          setConfirmationMode(null);
          save(status, true);
        }}
        tagGroupSnapshots={tagGroupSnapshots}
        scheduledFor={
          confirmationMode === "scheduled" && scheduledFor && workspace
            ? zonedInputToUtc(scheduledFor, workspace.timezone)
            : null
        }
        timezone={workspace?.timezone ?? "UTC"}
      />
    </section>
  );
}
