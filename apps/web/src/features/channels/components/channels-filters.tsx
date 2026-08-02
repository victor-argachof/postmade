import type { SocialPlatform } from "@postmade/types";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export type PlatformFilter = "all" | SocialPlatform;

const platforms: SocialPlatform[] = ["facebook", "linkedin", "instagram", "tiktok", "youtube"];

export function ChannelsFilters({
  onClear,
  onPlatformChange,
  onQueryChange,
  platform,
  query,
}: {
  onClear: () => void;
  onPlatformChange: (platform: PlatformFilter) => void;
  onQueryChange: (query: string) => void;
  platform: PlatformFilter;
  query: string;
}) {
  const { t } = useTranslation("channels");
  const hasFilters = Boolean(query.trim()) || platform !== "all";

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label={t("filters.searchLabel")}
          className="pl-10 pr-10"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          role="searchbox"
          type="text"
          value={query}
        />
        {query && (
          <Button
            aria-label={t("filters.clearSearch")}
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => onQueryChange("")}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <Select value={platform} onValueChange={(value) => onPlatformChange(value as PlatformFilter)}>
        <SelectTrigger className="h-11 w-full sm:w-56" aria-label={t("filters.platformLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allPlatforms")}</SelectItem>
          {platforms.map((item) => (
            <SelectItem key={item} value={item}>{t(`platforms.${item}.name`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button className="shrink-0" onClick={onClear} type="button" variant="ghost">{t("filters.clearAll")}</Button>
      )}
    </div>
  );
}
