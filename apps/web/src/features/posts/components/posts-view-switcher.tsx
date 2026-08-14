import { CalendarDays, List } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";
import { cn } from "@/shared/lib/utils";

export function PostsViewSwitcher() {
  const { t } = useTranslation("posts");
  const views = [
    { end: true, icon: List, label: t("views.list"), to: ROUTES.posts },
    {
      end: false,
      icon: CalendarDays,
      label: t("views.calendar"),
      to: ROUTES.postsCalendar,
    },
  ];

  return (
    <nav
      aria-label={t("views.navigation")}
      className="mt-6 inline-flex rounded-xl border border-border bg-muted/40 p-1"
    >
      {views.map(({ end, icon: Icon, label, to }) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              isActive &&
                "bg-card text-foreground shadow-sm ring-1 ring-border hover:text-foreground [&_svg]:text-primary"
            )
          }
          end={end}
          key={to}
          to={to}
        >
          <Icon className="size-4 transition-colors" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
