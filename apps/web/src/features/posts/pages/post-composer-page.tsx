import type {
  PublicationMedia,
  PublicationRecurrence,
  PublicationStatus,
  PublicationTagGroupSnapshot,
  ScheduledPublication,
} from "@postmade/types";
import { ArrowLeft, Clock3, ExternalLink, Save, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { PostTagGroupsSelector } from "@/features/tags/components/post-tag-groups-selector";
import { effectivePublicationContent } from "@/features/tags/lib/tags";
import { WORKSPACE_TRIAL_LIMITS } from "@/features/workspaces/lib/workspace-limits";
import {
  createWorkspacePublication,
  updateWorkspacePublication,
} from "@/features/workspaces/store/workspaces-slice";
import { ROUTES } from "@/routes/route-paths";
import { DateTimePicker } from "@/shared/components/date-time-picker";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { MediaUploader } from "../components/media-uploader";
import { PublicationConfirmationModal } from "../components/overlays/publication-confirmation-modal";
import { PlatformPreview } from "../components/platform-preview";
import { PublicationRecurrenceSettings } from "../components/publication-recurrence-settings";
import {
  PublicationTimingSwitcher,
  type PublicationTimingMode,
} from "../components/publication-timing-switcher";
import { utcToZonedInput, zonedInputToUtc } from "../lib/dates";
import { PLATFORM_RULES, validateTarget } from "../lib/platform-rules";
import { selectActiveWorkspace } from "../lib/selectors";

export function PostComposerPage() {
  const { t, i18n } = useTranslation("posts");
  const { t: tTags } = useTranslation("tags");
  const navigate = useNavigate();
  const openTagsManager = () => {
    window.open(ROUTES.tags, "_blank", "noopener,noreferrer");
  };
  const dispatch = useAppDispatch();
  const { publicationId } = useParams();
  const [search] = useSearchParams();
  const workspace = useAppSelector(selectActiveWorkspace);
  const user = useAppSelector((state) => state.auth.user);
  const existing = workspace?.resources.posts.find(
    (post) => post.id === publicationId
  );
  const [content, setContent] = useState(existing?.content ?? "");
  const [media, setMedia] = useState<PublicationMedia[]>(existing?.media ?? []);
  const [channelIds, setChannelIds] = useState<string[]>(
    existing?.targets.map((target) => target.channelId) ?? []
  );
  const [overrides, setOverrides] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      existing?.targets.map((target) => [
        target.channelId,
        target.contentOverride ?? "",
      ]) ?? []
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
  const [repeatPublication, setRepeatPublication] = useState(
    Boolean(existing?.recurrence)
  );
  const [recurrence, setRecurrence] = useState<PublicationRecurrence>(
    existing?.recurrence ?? { interval: 1, unit: "day" }
  );
  const [tagGroupSnapshots, setTagGroupSnapshots] = useState<
    PublicationTagGroupSnapshot[]
  >(existing?.tagGroupSnapshots ?? []);
  const [confirmationMode, setConfirmationMode] = useState<
    "published" | "scheduled" | null
  >(null);
  const [previewChannel, setPreviewChannel] = useState(channelIds[0] ?? "");
  useEffect(() => {
    if (!previewChannel && channelIds[0]) setPreviewChannel(channelIds[0]);
  }, [channelIds, previewChannel]);
  const channels =
    workspace?.resources.channels.filter((channel) => channel.connected) ?? [];
  const tagGroups = workspace?.resources.tagGroups ?? [];
  const selected = channels.filter((channel) =>
    channelIds.includes(channel.id)
  );
  const effectiveContent = effectivePublicationContent(
    content,
    tagGroupSnapshots
  );
  const errors = useMemo(
    () =>
      selected.flatMap((channel) =>
        validateTarget(
          channel.platform,
          effectivePublicationContent(
            overrides[channel.id]?.trim() || content,
            tagGroupSnapshots
          ),
          media
        ).map((error) => ({ channel, error }))
      ),
    [selected, overrides, content, media, tagGroupSnapshots]
  );
  const used =
    workspace?.resources.posts.filter(
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
    new Date().toISOString(),
    workspace?.timezone ?? "UTC"
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
        zonedInputToUtc(scheduledFor, workspace.timezone) <=
          new Date().toISOString())
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
  const save = (status: PublicationStatus, validated = false) => {
    if (!workspace || !user || readOnly) return;
    if (!validated && !validateSubmission(status)) return;
    const now = new Date().toISOString();
    const publication: ScheduledPublication = {
      id: existing?.id ?? crypto.randomUUID(),
      createdBy: existing?.createdBy ?? user.id,
      status,
      content: content.trim(),
      media,
      targets: selected.map((channel) => ({
        channelId: channel.id,
        platform: channel.platform,
        contentOverride: overrides[channel.id]?.trim() || null,
        mediaOverride: null,
        settings:
          existing?.targets.find((target) => target.channelId === channel.id)
            ?.settings ?? {},
        status,
        errorCode: null,
        externalUrl: null,
      })),
      tagGroupSnapshots,
      recurrence: repeatPublication ? recurrence : null,
      scheduledFor:
        status === "scheduled"
          ? zonedInputToUtc(scheduledFor, workspace.timezone)
          : null,
      publishedAt: status === "published" ? now : null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing)
      dispatch(
        updateWorkspacePublication({
          workspaceId: workspace.id,
          actorId: user.id,
          publication,
        })
      );
    else
      dispatch(
        createWorkspacePublication({
          workspaceId: workspace.id,
          actorId: user.id,
          publication,
        })
      );
    toast.success(t(`composer.feedback.${status}`));
    navigate(ROUTES.posts);
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
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">{t("composer.channels")}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {channels.map((channel) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3"
                  key={channel.id}
                >
                  <input
                    checked={channelIds.includes(channel.id)}
                    disabled={readOnly}
                    type="checkbox"
                    onChange={() =>
                      setChannelIds((current) =>
                        current.includes(channel.id)
                          ? current.filter((id) => id !== channel.id)
                          : [...current, channel.id]
                      )
                    }
                  />
                  <span>
                    <span className="block text-sm font-bold">
                      {channel.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(`platforms.${channel.platform}`)} · {channel.username}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {channels.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("composer.noChannels")}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex justify-between">
              <h2 className="font-bold">{t("composer.content")}</h2>
              <span className="text-xs text-muted-foreground">
                {effectiveContent.length}
              </span>
            </div>
            <textarea
              className="mt-3 min-h-40 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm"
              disabled={readOnly}
              placeholder={t("composer.placeholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-4">
              <MediaUploader
                disabled={readOnly}
                media={media}
                onChange={setMedia}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-bold">{t("composer.tags")}</h2>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={openTagsManager}
              >
                {tTags("composer.manage")}
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
            <PostTagGroupsSelector
              disabled={readOnly}
              groups={tagGroups}
              value={tagGroupSnapshots}
              onChange={setTagGroupSnapshots}
              onManage={openTagsManager}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">{t("composer.customize")}</h2>
            {selected.length > 0 ? (
              <div className="mt-4 space-y-4">
                {selected.map((channel) => {
                  const targetErrors = errors.filter(
                    (item) => item.channel.id === channel.id
                  );
                  return (
                    <div key={channel.id}>
                      <div className="flex justify-between text-sm">
                        <label
                          className="font-semibold"
                          htmlFor={`override-${channel.id}`}
                        >
                          {channel.displayName} ·{" "}
                          {t(`platforms.${channel.platform}`)}
                        </label>
                        <span className="text-muted-foreground">
                          {
                            effectivePublicationContent(
                              overrides[channel.id] || content,
                              tagGroupSnapshots
                            ).length
                          }
                          /{PLATFORM_RULES[channel.platform].maxCharacters}
                        </span>
                      </div>
                      <textarea
                        className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm"
                        disabled={readOnly}
                        id={`override-${channel.id}`}
                        placeholder={t("composer.inherit")}
                        value={overrides[channel.id] ?? ""}
                        onChange={(e) =>
                          setOverrides((current) => ({
                            ...current,
                            [channel.id]: e.target.value,
                          }))
                        }
                      />
                      {targetErrors.length > 0 && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {targetErrors
                            .map((item) =>
                              t(`composer.validation.${item.error}`)
                            )
                            .join(" ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("composer.customizeNoChannels")}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-bold">{t("composer.schedule")}</p>
            <PublicationTimingSwitcher
              disabled={readOnly}
              value={timingMode}
              onChange={changeTimingMode}
            >
              {timingMode === "scheduled" && (
                <div>
                  <p
                    className="text-sm text-muted-foreground"
                    id="schedule-timezone"
                  >
                    {t("composer.timezone", { timezone: workspace?.timezone })}
                  </p>
                  <DateTimePicker
                    aria-describedby="schedule-timezone"
                    aria-label={t("composer.schedule")}
                    disabled={readOnly}
                    disablePast={!readOnly}
                    min={minimumSchedule}
                    value={scheduledFor}
                    onChange={setScheduledFor}
                  />
                </div>
              )}
            </PublicationTimingSwitcher>
            <PublicationRecurrenceSettings
              enabled={repeatPublication}
              onEnabledChange={setRepeatPublication}
              onValueChange={setRecurrence}
              value={recurrence}
            />
          </div>
          {!readOnly && (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => save("draft")}
              >
                <Save className="size-4" />
                {t("composer.saveDraft")}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={timingMode === "scheduled" && !scheduledFor}
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
                        overrides[preview.id]?.trim() || content,
                        tagGroupSnapshots
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
        recurrence={repeatPublication ? recurrence : null}
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
