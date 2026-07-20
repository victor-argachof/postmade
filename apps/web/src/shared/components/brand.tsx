import { cn } from "@/shared/lib/utils";

interface BrandProps {
  compact?: boolean;
  className?: string;
}

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="Postmade"
    >
      <img
        src="/postmade-logo.png"
        alt=""
        className="size-6.75 shrink-0 object-contain"
        width="27"
        height="27"
      />
      {!compact && (
        <span className="whitespace-nowrap text-xl font-bold">
          Post<span className="text-primary">made</span>
        </span>
      )}
    </span>
  );
}
