import type { ScheduledPublication, SocialChannel } from "@postmade/types";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { PublicationStatusBadge } from "@/features/posts/components/publication-status-badge";
import { ROUTES } from "@/routes/route-paths";
import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table";

import { getLocalDateKey } from "../lib/selectors";

export function UpcomingPublications({
  channels,
  locale,
  publications,
  timezone,
}: {
  channels: SocialChannel[];
  locale: string;
  publications: ScheduledPublication[];
  timezone: string;
}) {
  const { t } = useTranslation("dashboard");
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(iso));
  const channelNames = (publication: ScheduledPublication) =>
    publication.targets.map(
      (target) =>
        channels.find((channel) => channel.id === target.channelId)
          ?.displayName ?? target.platform
    );
  const publicationUrl = (publication: ScheduledPublication) => {
    const date = getLocalDateKey(publication.scheduledFor!, timezone);
    return `${ROUTES.postsCalendar}?month=${date.slice(0, 7)}&date=${date}`;
  };
  const columns: DataTableColumn<ScheduledPublication>[] = [
    {
      id: "publication",
      header: t("upcoming.table.publication"),
      cell: (publication) => (
        <Link
          className="block max-w-sm min-w-52 truncate font-semibold hover:text-primary hover:underline"
          title={publication.content || t("upcoming.mediaOnly")}
          to={publicationUrl(publication)}
        >
          {publication.content || t("upcoming.mediaOnly")}
        </Link>
      ),
    },
    {
      id: "status",
      header: t("upcoming.table.status"),
      cell: (publication) => (
        <PublicationStatusBadge status={publication.status} />
      ),
    },
    {
      id: "channels",
      header: t("upcoming.table.channels"),
      cell: (publication) => (
        <span
          className="block max-w-52 truncate text-muted-foreground"
          title={channelNames(publication).join(", ")}
        >
          {channelNames(publication).join(", ")}
        </span>
      ),
    },
    {
      id: "date",
      header: t("upcoming.table.date"),
      cell: (publication) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(publication.scheduledFor!)}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("upcoming.table.actions"),
      className: "text-right",
      headerClassName: "text-right",
      cell: (publication) => (
        <Link
          aria-label={t("upcoming.table.open")}
          className="ml-auto grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          to={publicationUrl(publication)}
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg font-black">{t("upcoming.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("upcoming.description", { timezone })}
          </p>
        </div>
        <Link
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
          to={ROUTES.postsCalendar}
        >
          {t("upcoming.viewCalendar")}
        </Link>
      </div>
      {publications.length ? (
        <>
          <div className="hidden border-t border-border md:block">
            <DataTable
              columns={columns}
              data={publications}
              getRowId={(publication) => publication.id}
              label={t("upcoming.table.label")}
            />
          </div>
          <div className="divide-y divide-border border-t border-border md:hidden">
            {publications.map((publication) => (
              <Link
                className="group flex items-center gap-4 p-5"
                key={publication.id}
                to={publicationUrl(publication)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PublicationStatusBadge status={publication.status} />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {formatDate(publication.scheduledFor!)}
                    </span>
                  </div>
                  <p className="mt-2 truncate font-semibold">
                    {publication.content || t("upcoming.mediaOnly")}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {channelNames(publication).join(", ")}
                  </p>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="border-t border-border bg-muted/30 p-6 text-center">
          <p className="font-semibold">{t("upcoming.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("upcoming.emptyDescription")}
          </p>
        </div>
      )}
    </section>
  );
}
