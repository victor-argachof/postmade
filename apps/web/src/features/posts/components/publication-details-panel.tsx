import type { ScheduledPublication, SocialChannel } from "@postmade/types";
import { Edit3, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PublicationStatusBadge } from "@/features/posts/components/publication-status-badge";
import { Button } from "@/shared/components/ui/button";

export function PublicationDetailsPanel({
  canManage,
  channels,
  onClose,
  onEdit,
  publication,
}: {
  canManage: boolean;
  channels: SocialChannel[];
  onClose: () => void;
  onEdit: (id: string) => void;
  publication: ScheduledPublication | null;
}) {
  const { t } = useTranslation("posts", { keyPrefix: "calendar" });
  if (!publication) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        aria-label={t("details.title")}
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-border bg-background p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">{t("details.title")}</h2>
          <Button
            aria-label={t("close")}
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <div className="mt-5">
          <PublicationStatusBadge status={publication.status} />
          <p className="mt-5 leading-7 whitespace-pre-wrap">
            {publication.content || t("mediaOnly")}
          </p>
          <div className="mt-5 space-y-2">
            {publication.targets.map((target) => (
              <div
                className="rounded-xl border border-border p-3 text-sm"
                key={target.channelId}
              >
                <b>{t(`platforms.${target.platform}`)}</b>
                <p className="text-muted-foreground">
                  {
                    channels.find((channel) => channel.id === target.channelId)
                      ?.displayName
                  }
                </p>
              </div>
            ))}
          </div>
          {canManage &&
            !["published", "publishing"].includes(publication.status) && (
              <Button
                className="mt-6 w-full"
                onClick={() => onEdit(publication.id)}
              >
                <Edit3 className="size-4" />
                {t("details.edit")}
              </Button>
            )}
        </div>
      </aside>
    </div>
  );
}
