import type { SocialChannel } from "@postmade/types";
import { Radio, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { DataTableError } from "@/shared/components/data-table";
import { Button } from "@/shared/components/ui/button";

import { ChannelsDataTable } from "./channels-data-table";
import { ChannelsFilters, type PlatformFilter } from "./channels-filters";

export function ConnectedChannels({
  channels,
  canManage,
  error,
  onClear,
  onDisconnect,
  onPageChange,
  onPageSizeChange,
  onPlatformChange,
  onQueryChange,
  page,
  pageSize,
  platform,
  query,
  totalResults,
}: {
  channels: SocialChannel[];
  canManage: boolean;
  error?: DataTableError;
  onClear: () => void;
  onDisconnect: (channel: SocialChannel) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onPlatformChange: (platform: PlatformFilter) => void;
  onQueryChange: (query: string) => void;
  page: number;
  pageSize: number;
  platform: PlatformFilter;
  query: string;
  totalResults: number;
}) {
  const { t } = useTranslation("channels");

  return (
    <section className="mt-12" aria-labelledby="connected-channels-title">
      <h2
        id="connected-channels-title"
        className="text-2xl font-black tracking-tight"
      >
        {t("connected.title")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("connected.description")}
      </p>
      {!error && totalResults === 0 && !query && platform === "all" ? (
        <div className="mt-5 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Radio className="size-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-bold">{t("empty.title")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("empty.description")}
          </p>
        </div>
      ) : (
        <>
          <ChannelsFilters
            onClear={onClear}
            onPlatformChange={onPlatformChange}
            onQueryChange={onQueryChange}
            platform={platform}
            query={query}
          />
          {!error && channels.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <SearchX
                className="mx-auto size-7 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-bold">{t("filters.emptyTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("filters.emptyDescription")}
              </p>
              <Button
                className="mt-5"
                onClick={onClear}
                type="button"
                variant="outline"
              >
                {t("filters.clearAll")}
              </Button>
            </div>
          ) : (
            <ChannelsDataTable
              channels={channels}
              canManage={canManage}
              error={error}
              onDisconnect={onDisconnect}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              page={page}
              pageSize={pageSize}
              totalResults={totalResults}
            />
          )}
        </>
      )}
    </section>
  );
}
