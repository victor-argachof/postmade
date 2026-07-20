import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";
import { Brand } from "@/shared/components/brand";
import { MobilePreferences } from "./mobile-preferences";
import {
  SidebarNavigation,
  type SidebarNavigationItem,
} from "./sidebar-navigation";

interface MobileSidebarProps {
  open: boolean;
  items: SidebarNavigationItem[];
  navigationLabel: string;
  closeLabel: string;
  onClose: () => void;
}

export function MobileSidebar({
  open,
  items,
  navigationLabel,
  closeLabel,
  onClose,
}: MobileSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 cursor-pointer bg-black/50 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        aria-label={closeLabel}
      />
      <aside
        className="fixed inset-y-0 left-0 z-[60] flex w-[min(18rem,85vw)] flex-col border-r border-border bg-card px-4 py-5 shadow-2xl md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={navigationLabel}
      >
        <div className="flex h-10 items-center justify-between px-2">
          <NavLink to={ROUTES.dashboard} onClick={onClose}>
            <Brand />
          </NavLink>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={closeLabel}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <SidebarNavigation
          items={items}
          ariaLabel={navigationLabel}
          onNavigate={onClose}
        />
        <MobilePreferences />
      </aside>
    </>
  );
}
