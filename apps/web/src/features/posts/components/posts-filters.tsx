import type { SocialChannel, SocialPlatform } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { DatePicker } from "@/shared/components/date-time-picker";
import { SearchInput } from "@/shared/components/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { publicationFilterStatuses } from "../lib/publication-statuses";
import type { PublicationFilters } from "../types";

const statuses = ["all", ...publicationFilterStatuses] as const;
const platforms: SocialPlatform[] = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
];

export function PostsFilters({
  channels,
  filters,
  onChange,
}: {
  channels: SocialChannel[];
  filters: PublicationFilters;
  onChange: (filters: Partial<PublicationFilters>) => void;
}) {
  const { t } = useTranslation("posts");
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          aria-label={t("filters.search")}
          className="h-10"
          clearLabel={t("filters.clearSearch")}
          containerClassName="lg:col-span-2"
          placeholder={t("filters.search")}
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          onClear={() => onChange({ query: "" })}
        />
        <DatePicker
          aria-label={t("filters.from")}
          className="min-w-0"
          value={filters.from}
          onChange={(from) => onChange({ from })}
        />
        <DatePicker
          aria-label={t("filters.to")}
          className="min-w-0"
          value={filters.to}
          onChange={(to) => onChange({ to })}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Select
          value={filters.status}
          onValueChange={(status) =>
            onChange({ status: status as PublicationFilters["status"] })
          }
        >
          <SelectTrigger aria-label={t("filters.status")} className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all"
                  ? t("filters.allStatuses")
                  : t(`statuses.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.platform}
          onValueChange={(platform) =>
            onChange({ platform: platform as PublicationFilters["platform"] })
          }
        >
          <SelectTrigger aria-label={t("filters.platform")} className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allPlatforms")}</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {t(`platforms.${platform}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.channelId}
          onValueChange={(channelId) => onChange({ channelId })}
        >
          <SelectTrigger aria-label={t("filters.channel")} className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allChannels")}</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
