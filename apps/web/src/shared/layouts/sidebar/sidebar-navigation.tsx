import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/shared/lib/utils";

export interface SidebarNavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarNavigationSection {
  label?: string;
  items: SidebarNavigationItem[];
}

interface SidebarNavigationProps {
  sections: SidebarNavigationSection[];
  ariaLabel: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavigation({
  sections,
  ariaLabel,
  collapsed = false,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <nav className="mt-8 flex flex-col" aria-label={ariaLabel}>
      {sections.map((section, sectionIndex) => (
        <div
          key={section.label ?? "primary"}
          className={cn(
            sectionIndex > 0 &&
              (collapsed ? "mt-4 border-t border-border pt-4" : "mt-7")
          )}
        >
          {section.label && !collapsed && (
            <p className="mb-2 px-3 text-[0.6875rem] font-bold tracking-[0.16em] text-muted-foreground/75 uppercase">
              {section.label}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {section.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex h-11 items-center rounded-xl text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    isActive && "bg-primary/10 text-primary"
                  )
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
