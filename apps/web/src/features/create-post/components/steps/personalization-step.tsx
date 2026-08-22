import type {
  PublicationTagGroupSnapshot,
  SocialPlatform,
} from "@postmade/types";
import { useTranslation } from "react-i18next";

import { PostTagGroupsSelector } from "@/features/tags/components/post-tag-groups-selector";
import { effectivePublicationContent } from "@/features/tags/lib/tags";
import { Switch } from "@/shared/components/ui/switch";

import { PLATFORM_RULES } from "../../lib/platform-rules";
import { PostComposerStepCard } from "../post-composer-step-card";

export function PersonalizationStep({
  content,
  disabled,
  enabledPlatforms,
  errors,
  onEnabledPlatformsChange,
  onManageTags,
  onOverridesChange,
  onTagGroupOverridesChange,
  overrides,
  platforms,
  tagGroupOverrides,
  tagGroupSnapshots,
  workspaceId,
}: {
  content: string;
  disabled: boolean;
  enabledPlatforms: SocialPlatform[];
  errors: Array<{ error: string; platform: SocialPlatform }>;
  onEnabledPlatformsChange: (platforms: SocialPlatform[]) => void;
  onManageTags: () => void;
  onOverridesChange: (
    overrides: Partial<Record<SocialPlatform, string>>
  ) => void;
  onTagGroupOverridesChange: (
    overrides: Partial<Record<SocialPlatform, PublicationTagGroupSnapshot[]>>
  ) => void;
  overrides: Partial<Record<SocialPlatform, string>>;
  platforms: SocialPlatform[];
  tagGroupOverrides: Partial<
    Record<SocialPlatform, PublicationTagGroupSnapshot[]>
  >;
  tagGroupSnapshots: PublicationTagGroupSnapshot[];
  workspaceId: string;
}) {
  const { t } = useTranslation("createPost");

  if (platforms.length <= 1) return null;

  const toggle = (platform: SocialPlatform, enabled: boolean) => {
    if (enabled && tagGroupOverrides[platform] === undefined) {
      onTagGroupOverridesChange({
        ...tagGroupOverrides,
        [platform]: tagGroupSnapshots,
      });
    }
    onEnabledPlatformsChange(
      enabled
        ? [...enabledPlatforms, platform]
        : enabledPlatforms.filter((item) => item !== platform)
    );
  };

  return (
    <PostComposerStepCard title={t("composer.personalization")}>
      <div className="space-y-3">
        {platforms.map((platform) => {
          const enabled = enabledPlatforms.includes(platform);
          const platformErrors = Array.from(
            new Set(
              errors
                .filter(
                  (item) =>
                    item.platform === platform &&
                    item.error !== "empty" &&
                    item.error !== "mediaRequired"
                )
                .map((item) => item.error)
            )
          );

          return (
            <div className="rounded-xl border border-border p-4" key={platform}>
              <div className="flex items-center justify-between gap-4">
                <label
                  className="cursor-pointer text-sm font-bold"
                  htmlFor={`customize-${platform}`}
                >
                  {t(`platforms.${platform}`)}
                </label>
                <Switch
                  checked={enabled}
                  disabled={disabled}
                  id={`customize-${platform}`}
                  onCheckedChange={(checked) => toggle(platform, checked)}
                />
              </div>
              {enabled && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex justify-between gap-4 text-sm">
                    <label
                      className="font-semibold"
                      htmlFor={`override-${platform}`}
                    >
                      {t("composer.caption")}
                    </label>
                    <span className="shrink-0 text-muted-foreground">
                      {
                        effectivePublicationContent(
                          overrides[platform] || content,
                          tagGroupOverrides[platform] ?? tagGroupSnapshots
                        ).length
                      }
                      /{PLATFORM_RULES[platform].maxCharacters}
                    </span>
                  </div>
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    disabled={disabled}
                    id={`override-${platform}`}
                    placeholder={t("composer.inherit")}
                    value={overrides[platform] ?? ""}
                    onChange={(event) =>
                      onOverridesChange({
                        ...overrides,
                        [platform]: event.target.value,
                      })
                    }
                  />
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold">
                        {t("composer.tags")}
                      </p>
                    </div>
                    <PostTagGroupsSelector
                      disabled={disabled}
                      workspaceId={workspaceId}
                      value={tagGroupOverrides[platform] ?? tagGroupSnapshots}
                      onChange={(snapshots) =>
                        onTagGroupOverridesChange({
                          ...tagGroupOverrides,
                          [platform]: snapshots,
                        })
                      }
                      onManage={onManageTags}
                    />
                  </div>
                  {platformErrors.length > 0 && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {platformErrors
                        .map((error) => t(`composer.validation.${error}`))
                        .join(" ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PostComposerStepCard>
  );
}
