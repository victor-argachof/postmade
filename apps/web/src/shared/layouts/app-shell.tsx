import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Radio,
  Send,
  Settings2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";
import { AppFooter } from "@/shared/layouts/app-footer";
import { DesktopSidebar, MobileSidebar } from "@/shared/layouts/sidebar";
import { TopBar } from "@/shared/layouts/top-bar";

export function AppShell() {
  const { t } = useTranslation("navigation");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.localStorage.getItem("postmade.sidebar-collapsed") === "true"
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigationSections = [
    {
      items: [
        { to: ROUTES.dashboard, label: t("dashboard"), icon: LayoutDashboard },
      ],
    },
    {
      label: t("postsSection"),
      items: [
        { to: ROUTES.posts, label: t("posts"), icon: Send },
        { to: ROUTES.calendar, label: t("calendar"), icon: CalendarDays },
      ],
    },
    {
      label: t("workspaceSection"),
      items: [
        { to: ROUTES.workspaceChannels, label: t("channels"), icon: Radio },
        {
          to: ROUTES.workspaceSettings,
          label: t("workspaceSettings"),
          icon: Settings2,
        },
        {
          to: ROUTES.workspaceSubscription,
          label: t("subscription"),
          icon: CreditCard,
        },
      ],
    },
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("postmade.sidebar-collapsed", String(next));
      return next;
    });
  };

  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        sections={navigationSections}
        navigationLabel={t("mainNavigation")}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenMobileSidebar={openMobileSidebar}
        />
        <main className="min-w-0 flex-1 px-5 pt-7 pb-12 sm:px-8 sm:pt-10 lg:px-12">
          <Outlet />
        </main>
        <AppFooter />
      </div>
      <MobileSidebar
        open={mobileSidebarOpen}
        sections={navigationSections}
        navigationLabel={t("mainNavigation")}
        closeLabel={t("closeSidebar")}
        onClose={closeMobileSidebar}
      />
    </div>
  );
}
