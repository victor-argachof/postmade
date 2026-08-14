import type { ScheduledPublication } from "@postmade/types";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PublicationStatusBadge } from "@/features/posts/components/publication-status-badge";
import { Button } from "@/shared/components/ui/button";

export function CalendarAgenda({
  canManage,
  date,
  locale,
  onAdd,
  onSelect,
  publications,
  timezone,
}: {
  canManage: boolean;
  date: string;
  locale: string;
  onAdd: () => void;
  onSelect: (publication: ScheduledPublication) => void;
  publications: ScheduledPublication[];
  timezone: string;
}) {
  const { t } = useTranslation("posts", { keyPrefix: "calendar" });
  const dateLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="font-black">{t("agenda.title")}</h2>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        {canManage && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="size-4" />
            {t("agenda.add")}
          </Button>
        )}
      </div>
      {!publications.length ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          {t("agenda.empty")}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {publications.map((post) => (
            <button
              className="flex w-full items-center gap-4 p-5 text-left hover:bg-muted/40"
              key={post.id}
              onClick={() => onSelect(post)}
            >
              <time className="w-14 text-sm font-black">
                {new Intl.DateTimeFormat(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: timezone,
                }).format(
                  new Date(
                    post.scheduledFor ?? post.publishedAt ?? post.createdAt
                  )
                )}
              </time>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {post.content || t("mediaOnly")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {post.targets.length} {t("channels")}
                </p>
              </div>
              <PublicationStatusBadge status={post.status} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
