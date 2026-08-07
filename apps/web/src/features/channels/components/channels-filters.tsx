import type { SocialPlatform } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { SearchInput } from "@/shared/components/search-input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export type PlatformFilter = "all" | SocialPlatform;

const platforms: SocialPlatform[] = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
];

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
      <SearchInput
        aria-label={t("filters.searchLabel")}
        clearLabel={t("filters.clearSearch")}
        containerClassName="flex-1"
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange("")}
        placeholder={t("filters.searchPlaceholder")}
        value={query}
      />
      <Select
        value={platform}
        onValueChange={(value) => onPlatformChange(value as PlatformFilter)}
      >
        <SelectTrigger
          className="h-11 w-full sm:w-56"
          aria-label={t("filters.platformLabel")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allPlatforms")}</SelectItem>
          {platforms.map((item) => (
            <SelectItem key={item} value={item}>
              {t(`platforms.${item}.name`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          className="shrink-0"
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          {t("filters.clearAll")}
        </Button>
      )}
    </div>
  );
}
