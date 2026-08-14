import type { ScheduledPublication } from "@postmade/types";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";

function monthDays(month: string) {
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function CalendarGrid({
  month,
  selectedDate,
  groups,
  canManage,
  onCreatePublication,
  onSelectDate,
  onSelectPublication,
}: {
  month: string;
  selectedDate: string;
  groups: Record<string, ScheduledPublication[]>;
  canManage: boolean;
  onCreatePublication: (date: string) => void;
  onSelectDate: (date: string) => void;
  onSelectPublication: (post: ScheduledPublication) => void;
}) {
  const { t, i18n } = useTranslation("posts", { keyPrefix: "calendar" });
  const today = new Date().toISOString().slice(0, 10);
  const weekdays = Array.from({ length: 7 }, (_, day) =>
    new Intl.DateTimeFormat(i18n.language, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 7, 2 + day)))
  );
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {weekdays.map((day) => (
          <div
            className="p-3 text-center text-xs font-bold text-muted-foreground uppercase"
            key={day}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDays(month).map((date) => {
          const posts = groups[date] ?? [];
          return (
            <div
              className={cn(
                "min-h-32 cursor-pointer border-r border-b border-border p-2 text-left transition-colors hover:bg-muted/40",
                !date.startsWith(month) && "bg-muted/20 text-muted-foreground",
                selectedDate === date && "ring-2 ring-primary ring-inset"
              )}
              key={date}
              onClick={() => onSelectDate(date)}
            >
              <div className="flex items-center justify-between">
                <button
                  aria-label={t("selectDate")}
                  className={cn(
                    "inline-grid size-7 cursor-pointer place-items-center rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    date === today && "bg-primary text-primary-foreground"
                  )}
                  type="button"
                >
                  {Number(date.slice(-2))}
                </button>
                {canManage && selectedDate === date && date >= today && (
                  <button
                    aria-label={t("scheduleForDate", { date })}
                    className="grid size-7 cursor-pointer place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                    title={t("scheduleForDate", { date })}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCreatePublication(date);
                    }}
                  >
                    <Plus className="size-4" />
                  </button>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {posts.slice(0, 3).map((post) => (
                  <span
                    className={cn(
                      "block cursor-pointer truncate rounded px-2 py-1 text-[11px] font-semibold",
                      post.status === "published" &&
                        "bg-emerald-500/15 text-emerald-700",
                      post.status === "scheduled" &&
                        "bg-blue-500/15 text-blue-700",
                      post.status === "failed" && "bg-red-500/15 text-red-700"
                    )}
                    key={post.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectPublication(post);
                    }}
                  >
                    {post.content || t("mediaOnly")}
                  </span>
                ))}
                {posts.length > 3 && (
                  <span className="block px-2 text-[11px] text-muted-foreground">
                    {t("more", { count: posts.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
