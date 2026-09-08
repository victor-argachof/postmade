import type { PublicationMedia, SocialPlatform } from "@postmade/types";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";

import {
  mediaConstraintsForPlatforms,
  POSTMADE_MEDIA_LIMITS,
} from "../lib/platform-rules";
import {
  useCompleteMediaUploadMutation,
  useCreateMediaUploadMutation,
  useDeleteMediaMutation,
  useLazyGetMediaAccessQuery,
} from "../services/media-api";

export function MediaUploader({
  media,
  onChange,
  platforms,
  workspaceId,
  disabled = false,
}: {
  media: PublicationMedia[];
  onChange: (media: PublicationMedia[]) => void;
  platforms: SocialPlatform[];
  workspaceId: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation("createPost");
  const { t: tApiError } = useTranslation("apiErrors");
  const [createUpload] = useCreateMediaUploadMutation();
  const [completeUpload] = useCompleteMediaUploadMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [getAccess] = useLazyGetMediaAccessQuery();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [failedFiles, setFailedFiles] = useState<Record<string, File>>({});
  const mediaRef = useRef(media);
  useEffect(() => {
    mediaRef.current = media;
  }, [media]);
  const replace = useCallback(
    (next: PublicationMedia[]) => {
      mediaRef.current = next;
      onChange(next);
    },
    [onChange]
  );
  const constraints = mediaConstraintsForPlatforms(platforms);
  useEffect(() => {
    const missing = media.filter(
      (item) => item.status === "ready" && !item.url
    );
    if (!missing.length) return;
    void Promise.all(
      missing.map(async (item) => {
        try {
          return [
            item.id,
            (await getAccess({ workspaceId, mediaId: item.id }).unwrap()).url,
          ] as const;
        } catch {
          return [item.id, ""] as const;
        }
      })
    ).then((resolved) => {
      const urls = new Map(resolved);
      replace(
        mediaRef.current.map((item) =>
          urls.get(item.id) ? { ...item, url: urls.get(item.id)! } : item
        )
      );
    });
  }, [getAccess, media, replace, workspaceId]);

  const put = (
    url: string,
    file: File,
    headers: Record<string, string>,
    id: string
  ) =>
    new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", url);
      Object.entries(headers).forEach(([name, value]) =>
        request.setRequestHeader(name, value)
      );
      request.upload.onprogress = (event) =>
        event.lengthComputable &&
        setProgress((value) => ({
          ...value,
          [id]: Math.round((event.loaded / event.total) * 100),
        }));
      request.onload = () =>
        request.status >= 200 && request.status < 300
          ? resolve()
          : reject(new Error("upload failed"));
      request.onerror = () => reject(new Error("upload failed"));
      request.send(file);
    });

  const uploadFile = async (
    file: File,
    localId: string = crypto.randomUUID()
  ) => {
    setFailedFiles((current) => ({ ...current, [localId]: file }));
    const local: PublicationMedia = {
      id: localId,
      type: file.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(file),
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      status: "pending",
    };
    replace([...mediaRef.current.filter((item) => item.id !== localId), local]);
    try {
      const signed = await createUpload({
        workspaceId,
        input: { filename: file.name, mimeType: file.type, size: file.size },
      }).unwrap();
      await put(signed.uploadUrl, file, signed.requiredHeaders, localId);
      const completed = await completeUpload({
        workspaceId,
        mediaId: signed.media.id,
      }).unwrap();
      setFailedFiles((current) => {
        const next = { ...current };
        delete next[localId];
        return next;
      });
      replace([
        ...mediaRef.current.filter((item) => item.id !== localId),
        { ...completed, url: local.url, status: "ready" },
      ]);
    } catch (error) {
      replace([
        ...mediaRef.current.filter((item) => item.id !== localId),
        { ...local, status: "failed" },
      ]);
      toast.error(
        tApiError(getApiErrorTranslationKey(error)) ||
          t("composer.mediaUploadFailed")
      );
    }
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const selectedFiles = Array.from(fileList);
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
    void selectedFiles.reduce(
      (chain, file) => chain.then(() => uploadFile(file)),
      Promise.resolve()
    );
  };
  return (
    <div>
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm font-semibold transition-colors hover:bg-muted">
        <ImagePlus className="size-5" />
        {t("composer.addMedia")}
        <span className="max-w-md text-xs leading-5 font-normal text-muted-foreground">
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
                {item.status === "pending" && (
                  <small className="block text-muted-foreground">
                    {t("composer.mediaUploading", {
                      progress: progress[item.id] ?? 0,
                    })}
                  </small>
                )}
                {item.status === "failed" && (
                  <small className="text-destructive block">
                    {t("composer.mediaUploadFailed")}
                  </small>
                )}
              </span>
              <div className="flex gap-1">
                {item.status === "failed" && failedFiles[item.id] && (
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void uploadFile(failedFiles[item.id]!, item.id)
                    }
                  >
                    {t("composer.mediaRetry")}
                  </Button>
                )}
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
                  onClick={() => {
                    if (item.status === "ready")
                      void deleteMedia({ workspaceId, mediaId: item.id });
                    setFailedFiles((current) => {
                      const next = { ...current };
                      delete next[item.id];
                      return next;
                    });
                    replace(
                      mediaRef.current.filter(
                        (mediaItem) => mediaItem.id !== item.id
                      )
                    );
                  }}
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
