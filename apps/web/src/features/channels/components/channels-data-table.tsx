import type { SocialChannel } from "@postmade/types";
import { CheckCircle2, CircleAlert, Trash2, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ChannelAvatar } from "@/shared/components/channel-avatar";
import {
  DataTable,
  type DataTableColumn,
  type DataTableError,
} from "@/shared/components/data-table";
import { Pagination } from "@/shared/components/pagination";
import { Button } from "@/shared/components/ui/button";

import { platformVisuals } from "../lib/platform-visuals";

export function ChannelsDataTable({
  channels,
  canManage,
  error,
  onDisconnect,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalResults,
}: {
  channels: SocialChannel[];
  canManage: boolean;
  error?: DataTableError;
  onDisconnect: (channel: SocialChannel) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  page: number;
  pageSize: number;
  totalResults: number;
}) {
  const { t } = useTranslation("channels");
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const currentPage = Math.min(page, totalPages);
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
      cell: (channel) => {
        const status = {
          connected: {
            icon: CheckCircle2,
            className:
              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          },
          requires_reauthentication: {
            icon: CircleAlert,
            className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          },
          unavailable: {
            icon: WifiOff,
            className: "bg-destructive/10 text-destructive",
          },
          disconnected: {
            icon: WifiOff,
            className: "bg-muted text-muted-foreground",
          },
        }[channel.connectionStatus];
        const StatusIcon = status.icon;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}
          >
            <StatusIcon className="size-3.5" aria-hidden="true" />
            {t(`status.${channel.connectionStatus}`)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("table.actions"),
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
  const resultKey = totalResults === 1 ? "singular" : "plural";

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <DataTable
        columns={columns}
        data={channels}
        error={error}
        getRowId={(channel) => channel.id}
        header={
          <p className="text-sm text-muted-foreground">
            {t(`table.results.${resultKey}`, { count: totalResults })}
          </p>
        }
        label={t("table.label")}
      />
      {!error && (
        <Pagination
          labels={{
            perPage: t("pagination.perPage"),
            navigation: t("pagination.navigation"),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: (pageNumber) => t("pagination.page", { page: pageNumber }),
          }}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          page={currentPage}
          pageSize={pageSize}
          totalResults={totalResults}
        />
      )}
    </div>
  );
}
