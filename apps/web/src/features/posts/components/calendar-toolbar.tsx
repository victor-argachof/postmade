import type {
  PublicationStatus,
  SocialChannel,
  SocialPlatform,
} from "@postmade/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { publicationFilterStatuses } from "@/features/posts/lib/publication-statuses";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export interface CalendarFilters {
  platform: "all" | SocialPlatform;
  status: "all" | PublicationStatus;
  channelId: string;
}

const platforms: SocialPlatform[] = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
];
export function CalendarToolbar({
  channels,
  filters,
  monthLabel,
  onChange,
  onMonthChange,
  onToday,
}: {
  channels: SocialChannel[];
  filters: CalendarFilters;
  monthLabel: string;
  onChange: (change: Partial<CalendarFilters>) => void;
  onMonthChange: (delta: number) => void;
  onToday: () => void;
}) {
  const { t } = useTranslation("posts", { keyPrefix: "calendar" });
  return (
    <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-1.5">
        <Button
          aria-label={t("previous")}
          size="icon"
          variant="outline"
          onClick={() => onMonthChange(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={onToday}>
          {t("today")}
        </Button>
        <Button
          aria-label={t("next")}
          size="icon"
          variant="outline"
          onClick={() => onMonthChange(1)}
        >
          <ChevronRight />
        </Button>
        <h2 className="ml-2 text-lg font-black capitalize">{monthLabel}</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={filters.status}
          onValueChange={(status) =>
            onChange({ status: status as CalendarFilters["status"] })
          }
        >
          <SelectTrigger aria-label={t("filters.status")} className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
            {publicationFilterStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`statuses.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.platform}
          onValueChange={(platform) =>
            onChange({ platform: platform as CalendarFilters["platform"] })
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
