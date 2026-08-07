import { Search, X } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  clearLabel?: string;
  containerClassName?: string;
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { className, clearLabel, containerClassName, onClear, value, ...props },
    ref
  ) => {
    const hasValue = typeof value === "string" && value.length > 0;
    return (
      <div className={cn("relative min-w-0", containerClassName)}>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          {...props}
          ref={ref}
          className={cn(
            "pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20",
            hasValue && onClear ? "pr-11" : "pr-3",
            className
          )}
          role="searchbox"
          type="search"
          value={value}
        />
        {hasValue && onClear && (
          <Button
            aria-label={clearLabel}
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={onClear}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
