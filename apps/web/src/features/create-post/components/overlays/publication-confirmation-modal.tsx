import type {
  PublicationTagGroupSnapshot,
  SocialChannel,
} from "@postmade/types";
import { CalendarClock, Send, Tags, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

type ConfirmationMode = "published" | "scheduled";

export function PublicationConfirmationModal({
  channels,
  content,
  internalTitle,
  locale,
  mode,
  onClose,
  onConfirm,
  tagGroupSnapshots,
  scheduledFor,
  timezone,
}: {
  channels: SocialChannel[];
  content: string;
  internalTitle: string | null;
  locale: string;
  mode: ConfirmationMode | null;
  onClose: () => void;
  onConfirm: () => void;
  tagGroupSnapshots: PublicationTagGroupSnapshot[];
  scheduledFor: string | null;
  timezone: string;
}) {
  const { t } = useTranslation("createPost");
  const scheduled = mode === "scheduled";
  const formattedSchedule = scheduledFor
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: timezone,
      }).format(new Date(scheduledFor))
    : null;
  return (
    <Modal
      closeLabel={t("composer.confirmation.close")}
      onClose={onClose}
      open={Boolean(mode)}
      title={t(
        `composer.confirmation.${scheduled ? "scheduleTitle" : "publishTitle"}`
      )}
    >
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {t(
          `composer.confirmation.${scheduled ? "scheduleDescription" : "publishDescription"}`
        )}
      </p>
      <div className="mt-6 space-y-3">
        {internalTitle && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("composer.confirmation.internalTitle")}
            </p>
            <p className="mt-1 text-sm font-semibold">{internalTitle}</p>
          </div>
        )}
        <div className="flex gap-3 rounded-xl border border-border p-3">
          <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("composer.confirmation.destinations")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {channels.map((channel) => channel.displayName).join(", ")}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {t("composer.confirmation.content")}
          </p>
          <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap">
            {content || t("mediaOnly")}
          </p>
        </div>
        {tagGroupSnapshots.length > 0 && (
          <div className="flex gap-3 rounded-xl border border-border p-3">
            <Tags className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("composer.confirmation.tags")}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {tagGroupSnapshots
                  .map((snapshot) => snapshot.groupName)
                  .join(", ")}
              </p>
            </div>
          </div>
        )}
        {scheduled && formattedSchedule && (
          <div className="flex gap-3 rounded-xl border border-border p-3">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("composer.confirmation.schedule")}
              </p>
              <p className="mt-1 text-sm font-semibold">{formattedSchedule}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{timezone}</p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("composer.confirmation.cancel")}
        </Button>
        <Button type="button" onClick={onConfirm}>
          {scheduled ? (
            <CalendarClock className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
          {t(
            `composer.confirmation.${scheduled ? "confirmSchedule" : "confirmPublish"}`
          )}
        </Button>
      </div>
    </Modal>
  );
}
