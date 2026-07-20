import { CalendarDays, Radio, Send, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";

interface ModuleCardProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

function ModuleCard({ to, title, description, icon: Icon }: ModuleCardProps) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-8 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}

export function DashboardHome() {
  const { t } = useTranslation(["dashboard", "navigation"]);

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        {t("eyebrow", { ns: "dashboard" })}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
        {t("title", { ns: "dashboard" })}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
        {t("description", { ns: "dashboard" })}
      </p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard to={ROUTES.posts} title={t("posts", { ns: "navigation" })} description={t("postsDescription", { ns: "dashboard" })} icon={Send} />
        <ModuleCard to={ROUTES.channels} title={t("channels", { ns: "navigation" })} description={t("channelsDescription", { ns: "dashboard" })} icon={Radio} />
        <ModuleCard to={ROUTES.calendar} title={t("calendar", { ns: "navigation" })} description={t("calendarDescription", { ns: "dashboard" })} icon={CalendarDays} />
      </div>
    </section>
  );
}
