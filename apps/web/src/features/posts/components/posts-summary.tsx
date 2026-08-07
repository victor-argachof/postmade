import type { PublicationStatus, ScheduledPublication } from "@postmade/types";
import { useTranslation } from "react-i18next";

const statuses: PublicationStatus[] = [
  "draft",
  "scheduled",
  "published",
  "failed",
];

export function PostsSummary({
  publications,
}: {
  publications: ScheduledPublication[];
}) {
  const { t } = useTranslation("posts");
  const counts = publications.reduce<
    Partial<Record<PublicationStatus, number>>
  >((result, post) => {
    result[post.status] = (result[post.status] ?? 0) + 1;
    return result;
  }, {});

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statuses.map((status) => (
        <div
          className="rounded-2xl border border-border bg-card p-4"
          key={status}
        >
          <p className="text-sm text-muted-foreground">
            {t(`statuses.${status}`)}
          </p>
          <p className="mt-1 text-2xl font-black">{counts[status] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
