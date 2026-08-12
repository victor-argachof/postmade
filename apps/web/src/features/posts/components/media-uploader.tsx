import type { PublicationMedia } from "@postmade/types";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";

export function MediaUploader({
  media,
  onChange,
  disabled = false,
}: {
  media: PublicationMedia[];
  onChange: (media: PublicationMedia[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("posts");
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    onChange([
      ...media,
      ...Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        type: file.type.startsWith("video/")
          ? ("video" as const)
          : ("image" as const),
        url: URL.createObjectURL(file),
        filename: file.name,
        mimeType: file.type,
      })),
    ]);
  };
  return (
    <div>
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm font-semibold transition-colors hover:bg-muted">
        <ImagePlus className="size-5" />
        {t("composer.addMedia")}
        <input
          accept="image/*,video/*"
          className="sr-only"
          disabled={disabled}
          multiple
          type="file"
          onChange={(e) => addFiles(e.target.files)}
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
