import type {
  PublicationMedia,
  PublicationTagGroupSnapshot,
  SocialPlatform,
} from "@postmade/types";
import { useTranslation } from "react-i18next";

import { PostTagGroupsSelector } from "@/features/tags/components/post-tag-groups-selector";
import { Button } from "@/shared/components/ui/button";

import { MediaUploader } from "../media-uploader";
import { PostComposerStepCard } from "../post-composer-step-card";

export function ContentStep({
  content,
  disabled,
  effectiveContentLength,
  media,
  mediaDisabled = false,
  onTitleChange,
  onContentChange,
  onManageTags,
  onMediaChange,
  onTagGroupsChange,
  selectedPlatforms,
  tagGroupSnapshots,
  title,
  titleDisabled = disabled,
  workspaceId,
}: {
  content: string;
  disabled: boolean;
  effectiveContentLength: number;
  media: PublicationMedia[];
  mediaDisabled?: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onManageTags: () => void;
  onMediaChange: (media: PublicationMedia[]) => void;
  onTagGroupsChange: (snapshots: PublicationTagGroupSnapshot[]) => void;
  selectedPlatforms: SocialPlatform[];
  tagGroupSnapshots: PublicationTagGroupSnapshot[];
  title: string;
  titleDisabled?: boolean;
  workspaceId: string;
}) {
  const { t } = useTranslation("createPost");
  const { t: tTags } = useTranslation("tags");

  return (
    <PostComposerStepCard title={t("composer.content")}>
      <MediaUploader
        disabled={disabled || mediaDisabled}
        media={media}
        platforms={selectedPlatforms}
        workspaceId={workspaceId}
        onChange={onMediaChange}
      />
      {mediaDisabled && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("composer.mediaUnavailable")}
        </p>
      )}
      <div className="mt-5">
        <div className="flex justify-between gap-4">
          <label className="text-sm font-semibold" htmlFor="post-title">
            {t("composer.internalTitle")}
          </label>
          <span className="text-xs text-muted-foreground">
            {title.length}/120
          </span>
        </div>
        <input
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          disabled={titleDisabled}
          id="post-title"
          maxLength={120}
          placeholder={t("composer.internalTitlePlaceholder")}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("composer.internalTitleDescription")}
        </p>
      </div>
      <div className="mt-5 flex justify-between gap-4">
        <label className="text-sm font-semibold" htmlFor="post-caption">
          {t("composer.caption")}
        </label>
        <span className="text-xs text-muted-foreground">
          {effectiveContentLength}
        </span>
      </div>
      <textarea
        className="mt-2 min-h-40 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        disabled={disabled}
        id="post-caption"
        placeholder={t("composer.placeholder")}
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
      />
      <div className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">{t("composer.tags")}</p>
          <Button
            className="h-auto p-0 text-xs"
            type="button"
            variant="link"
            onClick={onManageTags}
          >
            {tTags("composer.manage")}
          </Button>
        </div>
        <PostTagGroupsSelector
          disabled={disabled}
          workspaceId={workspaceId}
          value={tagGroupSnapshots}
          onChange={onTagGroupsChange}
          onManage={onManageTags}
        />
      </div>
    </PostComposerStepCard>
  );
}
