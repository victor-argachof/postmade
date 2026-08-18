import type { SocialChannel } from "@postmade/types";
import { Radio, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";

import { ChannelsDataTable } from "./channels-data-table";
import { ChannelsFilters, type PlatformFilter } from "./channels-filters";

export function ConnectedChannels({
  channels,
  canManage,
  onDisconnect,
}: {
  channels: SocialChannel[];
  canManage: boolean;
  onDisconnect: (channel: SocialChannel) => void;
}) {
  const { t } = useTranslation("channels");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredChannels = useMemo(
    () =>
      channels.filter((channel) => {
        const matchesPlatform =
          platform === "all" || channel.platform === platform;
        const matchesQuery =
          !normalizedQuery ||
          channel.displayName.toLocaleLowerCase().includes(normalizedQuery) ||
          channel.username.toLocaleLowerCase().includes(normalizedQuery);
        return matchesPlatform && matchesQuery;
      }),
    [channels, normalizedQuery, platform]
  );
  const clearFilters = () => {
    setQuery("");
    setPlatform("all");
  };

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
      {channels.length === 0 ? (
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
            onClear={clearFilters}
            onPlatformChange={setPlatform}
            onQueryChange={setQuery}
            platform={platform}
            query={query}
          />
          {filteredChannels.length === 0 ? (
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
                onClick={clearFilters}
                type="button"
                variant="outline"
              >
                {t("filters.clearAll")}
              </Button>
            </div>
          ) : (
            <ChannelsDataTable
              key={`${normalizedQuery}:${platform}`}
              channels={filteredChannels}
              canManage={canManage}
              onDisconnect={onDisconnect}
            />
          )}
        </>
      )}
    </section>
  );
}
