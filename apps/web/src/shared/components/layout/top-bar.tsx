import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";
import { Brand } from "@/shared/components/brand";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { UserMenu } from "@/shared/components/user-menu";
import { Button } from "@/shared/components/ui/button";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export function TopBar({ sidebarCollapsed, onToggleSidebar, onOpenMobileSidebar }: TopBarProps) {
  const { t } = useTranslation("navigation");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileSidebar}
            aria-label={t("openSidebar")}
            title={t("openSidebar")}
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={onToggleSidebar}
            aria-label={t(sidebarCollapsed ? "expandSidebar" : "collapseSidebar")}
            title={t(sidebarCollapsed ? "expandSidebar" : "collapseSidebar")}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-5" aria-hidden="true" /> : <PanelLeftClose className="size-5" aria-hidden="true" />}
          </Button>
          <NavLink to={ROUTES.dashboard} className="md:hidden">
            <Brand className="[&_img]:size-[26px] [&_span]:text-lg" />
          </NavLink>
          <WorkspaceSwitcher className="hidden md:block" />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="mx-1 h-7 w-px bg-border" aria-hidden="true" />
          </div>
          <UserMenu />
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-2.5 md:hidden">
        <WorkspaceSwitcher className="w-full" />
      </div>
    </header>
  );
}
