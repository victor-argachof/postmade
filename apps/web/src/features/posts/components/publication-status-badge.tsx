import type { PublicationStatus } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";

export function PublicationStatusBadge({
  status,
}: {
  status: PublicationStatus;
}) {
  const { t } = useTranslation("posts");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        status === "published" &&
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        status === "scheduled" &&
          "bg-blue-500/15 text-blue-700 dark:text-blue-300",
        status === "draft" && "bg-muted text-muted-foreground",
        status === "failed" && "bg-red-500/15 text-red-700 dark:text-red-300",
        status === "publishing" &&
          "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      )}
    >
      {t(`statuses.${status}`)}
    </span>
  );
}
