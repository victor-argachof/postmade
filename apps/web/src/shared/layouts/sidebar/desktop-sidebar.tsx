import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";
import { Brand } from "@/shared/components/brand";
import { cn } from "@/shared/lib/utils";

import {
  SidebarNavigation,
  type SidebarNavigationSection,
} from "./sidebar-navigation";

interface DesktopSidebarProps {
  collapsed: boolean;
  sections: SidebarNavigationSection[];
  navigationLabel: string;
}

export function DesktopSidebar({
  collapsed,
  sections,
  navigationLabel,
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card px-3 py-6 transition-[width] duration-200 md:flex",
        collapsed ? "w-20" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-10 items-center",
          collapsed ? "justify-center" : "px-3"
        )}
      >
        <NavLink
          to={ROUTES.dashboard}
          className="overflow-hidden whitespace-nowrap"
          aria-label="Postmade"
        >
          <Brand compact={collapsed} />
        </NavLink>
      </div>
      <SidebarNavigation
        sections={sections}
        ariaLabel={navigationLabel}
        collapsed={collapsed}
      />
    </aside>
  );
}
