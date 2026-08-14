import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";

interface TooltipProps {
  label: string;
  content: ReactNode;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Tooltip({
  label,
  content,
  children,
  className,
  containerClassName,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    side: "top" | "bottom";
  } | null>(null);
  const open = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const side = rect.top >= 120 ? "top" : "bottom";
    setPosition({
      left: Math.min(
        Math.max(rect.left + rect.width / 2, 152),
        window.innerWidth - 152
      ),
      top: side === "top" ? rect.top - 8 : rect.bottom + 8,
      side,
    });
  };

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  return (
    <span
      aria-describedby={position ? tooltipId : undefined}
      className={cn("relative inline-flex", containerClassName)}
      ref={triggerRef}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPosition(null);
      }}
      onFocusCapture={open}
      onMouseEnter={open}
      onMouseLeave={() => setPosition(null)}
    >
      {children}
      {position &&
        createPortal(
          <span
            aria-label={label}
            className={cn(
              "pointer-events-none fixed z-[100] w-64 rounded-xl bg-foreground px-3 py-2 text-left text-xs leading-5 font-normal text-background opacity-100 shadow-lg",
              className
            )}
            id={tooltipId}
            role="tooltip"
            style={{
              left: position.left,
              top: position.top,
              transform:
                position.side === "top"
                  ? "translate(-50%, -100%)"
                  : "translateX(-50%)",
            }}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
}
