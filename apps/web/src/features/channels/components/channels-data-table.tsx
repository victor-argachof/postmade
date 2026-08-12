import type { SocialChannel } from "@postmade/types";
import { CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table";
import { ChannelAvatar } from "@/shared/components/channel-avatar";
import { Pagination } from "@/shared/components/pagination";
import { Button } from "@/shared/components/ui/button";

import { platformVisuals } from "./platform-grid";

export function ChannelsDataTable({
  channels,
  canManage,
  onDisconnect,
  resetKey,
}: {
  channels: SocialChannel[];
  canManage: boolean;
  onDisconnect: (channel: SocialChannel) => void;
  resetKey?: string;
}) {
  const { t } = useTranslation("channels");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(channels.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const start = (page - 1) * pageSize;
  const visibleChannels = channels.slice(start, start + pageSize);
  const columns: DataTableColumn<SocialChannel>[] = [
    {
      id: "platform",
      header: t("table.platform"),
      cell: (channel) => {
        const { icon: PlatformIcon, className } =
          platformVisuals[channel.platform];
        return (
          <span className="flex items-center gap-3 font-semibold">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className}`}
              aria-hidden="true"
            >
              <PlatformIcon className="size-4" />
            </span>
            {t(`platforms.${channel.platform}.name`)}
          </span>
        );
      },
    },
    {
      id: "account",
      header: t("table.account"),
      cell: (channel) => (
        <span className="flex min-w-44 items-center gap-3">
          <ChannelAvatar channel={channel} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">
              {channel.displayName}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {channel.username}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "status",
      header: t("table.status"),
      cell: () => (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          {t("status.connected")}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      headerClassName: "text-right",
      className: "text-right",
      cell: (channel) => (
        <Button
          aria-label={t("actions.disconnectNamed", {
            name: channel.displayName,
          })}
          disabled={!canManage}
          onClick={() => onDisconnect(channel)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];
  const resultKey = channels.length === 1 ? "singular" : "plural";

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <DataTable
        columns={columns}
        data={visibleChannels}
        getRowId={(channel) => channel.id}
        header={
          <p className="text-sm text-muted-foreground">
            {t(`table.results.${resultKey}`, { count: channels.length })}
          </p>
        }
        label={t("table.label")}
      />
      <Pagination
        labels={{
          perPage: t("pagination.perPage"),
          navigation: t("pagination.navigation"),
          previous: t("pagination.previous"),
          next: t("pagination.next"),
          page: (pageNumber) => t("pagination.page", { page: pageNumber }),
        }}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        page={page}
        pageSize={pageSize}
        totalResults={channels.length}
      />
    </div>
  );
}
