import type { PublicationMedia, PublicationTagGroupSnapshot, SocialPlatform, TagGroup } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { PostTagGroupsSelector } from "@/features/tags/components/post-tag-groups-selector";
import { effectivePublicationContent } from "@/features/tags/lib/tags";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";

import { PLATFORM_RULES } from "../../lib/platform-rules";
import { MediaUploader } from "../media-uploader";
import { PostComposerStepCard } from "../post-composer-step-card";

interface ContentStepProps {
  content: string;
  customizeByPlatform: boolean;
  disabled: boolean;
  effectiveContentLength: number;
  errors: Array<{ error: string; platform: SocialPlatform }>;
  media: PublicationMedia[];
  onContentChange: (content: string) => void;
  onCustomizeByPlatformChange: (enabled: boolean) => void;
  onManageTags: () => void;
  onMediaChange: (media: PublicationMedia[]) => void;
  onCaptionOverridesChange: (captionOverrides: Partial<Record<SocialPlatform, string>>) => void;
  onTagGroupsChange: (snapshots: PublicationTagGroupSnapshot[]) => void;
  captionOverrides: Partial<Record<SocialPlatform, string>>;
  selectedPlatforms: SocialPlatform[];
  tagGroups: TagGroup[];
  tagGroupSnapshots: PublicationTagGroupSnapshot[];
}

export function ContentStep(props: ContentStepProps) {
  const { t } = useTranslation("posts");
  const { t: tTags } = useTranslation("tags");
  const {
    content, customizeByPlatform, disabled, effectiveContentLength, errors,
    media, onContentChange, onCustomizeByPlatformChange, onManageTags,
    onMediaChange, onCaptionOverridesChange, onTagGroupsChange, captionOverrides,
    selectedPlatforms, tagGroups, tagGroupSnapshots,
  } = props;

  return (
    <PostComposerStepCard title={t("composer.content")}>
      <MediaUploader disabled={disabled} media={media} onChange={onMediaChange} />
      <div className="mt-5 flex justify-between gap-4">
        <label className="text-sm font-semibold" htmlFor="post-caption">{t("composer.caption")}</label>
        <span className="text-xs text-muted-foreground">{effectiveContentLength}</span>
      </div>
      <textarea
        className="mt-2 min-h-40 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        disabled={disabled}
        id="post-caption"
        placeholder={t("composer.placeholder")}
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
      />
      <div className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">{t("composer.tags")}</p>
          <Button className="h-auto p-0 text-xs" type="button" variant="link" onClick={onManageTags}>
            {tTags("composer.manage")}
          </Button>
        </div>
        <PostTagGroupsSelector disabled={disabled} groups={tagGroups} value={tagGroupSnapshots} onChange={onTagGroupsChange} onManage={onManageTags} />
      </div>
      {selectedPlatforms.length > 1 && (
      <div className="mt-5 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <label className="cursor-pointer text-sm font-bold" htmlFor="customize-by-platform">{t("composer.customize")}</label>
          <Switch checked={customizeByPlatform} disabled={disabled} id="customize-by-platform" onCheckedChange={onCustomizeByPlatformChange} />
        </div>
        {customizeByPlatform && (
          <div className="mt-4 border-t border-border pt-4">
            {selectedPlatforms.length > 0 ? (
              <div className="space-y-4">
                {selectedPlatforms.map((platform) => {
                  const platformErrors = Array.from(new Set(errors.filter((item) => item.platform === platform && item.error !== "empty" && item.error !== "mediaRequired").map((item) => item.error)));
                  return (
                    <div key={platform}>
                      <div className="flex justify-between gap-4 text-sm">
                        <label className="font-semibold" htmlFor={`override-${platform}`}>{t(`platforms.${platform}`)}</label>
                        <span className="shrink-0 text-muted-foreground">
                          {effectivePublicationContent(captionOverrides[platform] || content, tagGroupSnapshots).length}/{PLATFORM_RULES[platform].maxCharacters}
                        </span>
                      </div>
                      <textarea
                        className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        disabled={disabled}
                        id={`override-${platform}`}
                        placeholder={t("composer.inherit")}
                        value={captionOverrides[platform] ?? ""}
                        onChange={(event) => onCaptionOverridesChange({ ...captionOverrides, [platform]: event.target.value })}
                      />
                      {platformErrors.length > 0 && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {platformErrors.map((error) => t(`composer.validation.${error}`)).join(" ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("composer.customizeNoChannels")}</p>}
          </div>
        )}
      </div>
      )}
    </PostComposerStepCard>
  );
}
