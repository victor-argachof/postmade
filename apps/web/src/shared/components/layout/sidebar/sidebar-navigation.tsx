import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

export interface SidebarNavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarNavigationProps {
  items: SidebarNavigationItem[];
  ariaLabel: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavigation({
  items,
  ariaLabel,
  collapsed = false,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <nav className="mt-8 flex flex-col gap-2" aria-label={ariaLabel}>
      {items.map(({ to, label, icon: Icon }) => (
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
              isActive && "bg-primary/10 text-primary",
            )
          }
        >
          <Icon className="size-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
