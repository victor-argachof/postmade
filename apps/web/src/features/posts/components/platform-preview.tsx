import type { PublicationMedia, SocialPlatform } from "@postmade/types";
import { useTranslation } from "react-i18next";

export function PlatformPreview({
  platform,
  content,
  media,
}: {
  platform: SocialPlatform;
  content: string;
  media: PublicationMedia[];
}) {
  const { t } = useTranslation("posts");
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary uppercase">
          {platform.slice(0, 2)}
        </span>
        <div>
          <p className="text-sm font-bold">Postmade</p>
          <p className="text-xs text-muted-foreground">
            {t(`platforms.${platform}`)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 whitespace-pre-wrap">
        {content || t("composer.previewEmpty")}
      </p>
      {media.length > 0 && (
        <div
          className={`mt-4 grid gap-1 overflow-hidden rounded-xl ${media.length > 1 ? "grid-cols-2" : ""}`}
        >
          {media.slice(0, 4).map((item) =>
            item.type === "image" ? (
              <img
                alt={item.filename}
                className="h-40 w-full object-cover"
                key={item.id}
                src={item.url}
              />
            ) : (
              <div
                className="grid h-40 place-items-center bg-muted text-xs font-bold"
                key={item.id}
              >
                {item.filename}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
