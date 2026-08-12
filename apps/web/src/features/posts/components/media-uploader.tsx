import type { PublicationMedia, SocialPlatform } from "@postmade/types";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";

import {
  mediaConstraintsForPlatforms,
  POSTMADE_MEDIA_LIMITS,
} from "../lib/platform-rules";

export function MediaUploader({
  media,
  onChange,
  platforms,
  disabled = false,
}: {
  media: PublicationMedia[];
  onChange: (media: PublicationMedia[]) => void;
  platforms: SocialPlatform[];
  disabled?: boolean;
}) {
  const { t } = useTranslation("posts");
  const constraints = mediaConstraintsForPlatforms(platforms);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    if (media.length + selectedFiles.length > constraints.maxMedia) {
      toast.error(
        t("composer.mediaGuidance.tooMany", { count: constraints.maxMedia })
      );
      return;
    }
    const invalidType = selectedFiles.some(
      (file) => !constraints.mimeTypes.includes(file.type as never)
    );
    if (invalidType) {
      toast.error(t("composer.mediaGuidance.invalidType"));
      return;
    }
    const oversized = selectedFiles.some(
      (file) =>
        file.size >
        (file.type.startsWith("image/")
          ? POSTMADE_MEDIA_LIMITS.imageBytes
          : POSTMADE_MEDIA_LIMITS.videoBytes)
    );
    if (oversized) {
      toast.error(t("composer.mediaGuidance.tooLarge"));
      return;
    }
    onChange([
      ...media,
      ...selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        type: file.type.startsWith("video/")
          ? ("video" as const)
          : ("image" as const),
        url: URL.createObjectURL(file),
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      })),
    ]);
  };
  return (
    <div>
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm font-semibold transition-colors hover:bg-muted">
        <ImagePlus className="size-5" />
        {t("composer.addMedia")}
        <span className="max-w-md text-xs font-normal leading-5 text-muted-foreground">
          {t("composer.mediaGuidance.summary", {
            count: constraints.maxMedia,
            formats: [
              ...(constraints.allowsImages ? ["JPG", "PNG", "WebP"] : []),
              ...(constraints.allowsVideos ? ["MP4", "MOV"] : []),
            ].join(", "),
          })}
        </span>
        <span className="text-xs font-normal text-muted-foreground">
          {constraints.allowsImages &&
            t("composer.mediaGuidance.imageLimit", { size: 10 })}
          {constraints.allowsImages && constraints.allowsVideos && " · "}
          {constraints.allowsVideos &&
            t("composer.mediaGuidance.videoLimit", { size: 100 })}
        </span>
        <input
          accept={constraints.mimeTypes.join(",")}
          className="sr-only"
          disabled={disabled}
          multiple
          type="file"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {media.length > 0 && (
        <div className="mt-3 space-y-2">
          {media.map((item, index) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-border p-2"
              key={item.id}
            >
              <GripVertical className="size-4 text-muted-foreground" />
              <div className="grid size-12 place-items-center overflow-hidden rounded-lg bg-muted">
                {item.type === "image" ? (
                  <img
                    alt=""
                    className="size-full object-cover"
                    src={item.url}
                  />
                ) : (
                  <span className="text-xs font-bold">VIDEO</span>
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm">
                {item.filename}
              </span>
              <div className="flex gap-1">
                <Button
                  disabled={index === 0}
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const next = [...media];
                    [next[index - 1], next[index]] = [
                      next[index]!,
                      next[index - 1]!,
                    ];
                    onChange(next);
                  }}
                >
                  ↑
                </Button>
                <Button
                  disabled={index === media.length - 1}
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const next = [...media];
                    [next[index], next[index + 1]] = [
                      next[index + 1]!,
                      next[index]!,
                    ];
                    onChange(next);
                  }}
                >
                  ↓
                </Button>
                <Button
                  aria-label={t("actions.delete")}
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    onChange(
                      media.filter((mediaItem) => mediaItem.id !== item.id)
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
