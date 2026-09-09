import type { ScheduledPublication, SocialChannel } from "@postmade/types";
import {
  Copy,
  Edit3,
  RotateCcw,
  TextCursorInput,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/shared/components/data-table";
import { Pagination } from "@/shared/components/pagination";
import { Button } from "@/shared/components/ui/button";
import { Tooltip } from "@/shared/components/ui/tooltip";

import { publicationDisplayTitle } from "../lib/publication-display";
import { PublicationStatusBadge } from "./publication-status-badge";

type Action = "delete" | "cancel" | "duplicate" | "retry";

export function PostsDataTable({
  canManage,
  channels,
  empty,
  locale,
  onAction,
  onEdit,
  onRename,
  publications,
  remotePagination,
  timezone,
}: {
  canManage: boolean;
  channels: SocialChannel[];
  empty: ReactNode;
  locale: string;
  onAction: (action: Action, id: string) => void;
  onEdit: (id: string) => void;
  onRename: (id: string) => void;
  publications: ScheduledPublication[];
  remotePagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  timezone: string;
}) {
  const { t } = useTranslation("posts");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<DataTableSorting | undefined>({
    columnId: "date",
    direction: "desc",
  });
  const activePageSize = remotePagination?.pageSize ?? pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil((remotePagination?.total ?? publications.length) / activePageSize)
  );
  const currentPage = Math.min(remotePagination?.page ?? page, totalPages);
  const sortableValue = (post: ScheduledPublication, columnId: string) => {
    if (columnId === "publication")
      return (post.title || post.content).toLocaleLowerCase(locale);
    if (columnId === "status")
      return t(`statusLabels.${post.status}`).toLocaleLowerCase(locale);
    if (columnId === "channels") return post.targets.length;
    return new Date(
      post.scheduledFor ?? post.publishedAt ?? post.createdAt
    ).getTime();
  };
  const sorted = sorting
    ? [...publications].sort((first, second) => {
        const firstValue = sortableValue(first, sorting.columnId);
        const secondValue = sortableValue(second, sorting.columnId);
        const comparison =
          typeof firstValue === "number" && typeof secondValue === "number"
            ? firstValue - secondValue
            : String(firstValue).localeCompare(String(secondValue), locale);
        return sorting.direction === "asc" ? comparison : -comparison;
      })
    : publications;
  const visible = remotePagination
    ? sorted
    : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const date = (post: ScheduledPublication) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(
      new Date(post.scheduledFor ?? post.publishedAt ?? post.createdAt)
    );
  const channelNames = (post: ScheduledPublication) =>
    post.targets.map(
      (target) =>
        channels.find((channel) => channel.id === target.channelId)
          ?.displayName ?? t(`platforms.${target.platform}`)
    );
  const actionButton = (
    label: string,
    icon: ReactNode,
    onClick: () => void
  ) => (
    <Tooltip className="w-max whitespace-nowrap" content={label} label={label}>
      <Button aria-label={label} size="icon" variant="ghost" onClick={onClick}>
        {icon}
      </Button>
    </Tooltip>
  );
  const actions = (post: ScheduledPublication) => (
    <div className="flex flex-wrap justify-end gap-1">
      {canManage && ["published", "publishing"].includes(post.status)
        ? actionButton(
            t("actions.editTitle"),
            <TextCursorInput className="size-4" />,
            () => onRename(post.id)
          )
        : canManage &&
          actionButton(t("actions.edit"), <Edit3 className="size-4" />, () =>
            onEdit(post.id)
          )}
      {canManage &&
        actionButton(t("actions.duplicate"), <Copy className="size-4" />, () =>
          onAction("duplicate", post.id)
        )}
      {canManage &&
        post.status === "scheduled" &&
        actionButton(t("actions.cancel"), <XCircle className="size-4" />, () =>
          onAction("cancel", post.id)
        )}
      {canManage &&
        post.status === "failed" &&
        actionButton(t("actions.retry"), <RotateCcw className="size-4" />, () =>
          onAction("retry", post.id)
        )}
      {canManage &&
        !["published", "publishing"].includes(post.status) &&
        actionButton(t("actions.delete"), <Trash2 className="size-4" />, () =>
          onAction("delete", post.id)
        )}
    </div>
  );
  const columns: DataTableColumn<ScheduledPublication>[] = [
    {
      id: "publication",
      header: t("table.publication"),
      sortable: true,
      sortLabel: t("table.sortByPublication"),
      cell: (post) => {
        const displayTitle = publicationDisplayTitle(post, t("mediaOnly"));
        return (
          <div className="max-w-sm min-w-52">
            <Tooltip
              className="w-72 max-w-[min(24rem,80vw)]"
              containerClassName="w-full"
              content={displayTitle}
              label={t("table.fullContent")}
            >
              <p
                className="w-full cursor-help truncate font-semibold"
                tabIndex={0}
              >
                {displayTitle}
              </p>
            </Tooltip>
            {post.title && post.content && (
              <p className="mt-1 w-full truncate text-xs text-muted-foreground">
                {post.content}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: t("table.status"),
      sortable: true,
      sortLabel: t("table.sortByStatus"),
      cell: (post) => <PublicationStatusBadge status={post.status} />,
    },
    {
      id: "channels",
      header: t("table.channels"),
      sortable: true,
      sortLabel: t("table.sortByChannels"),
      cell: (post) => {
        const names = channelNames(post);
        return (
          <Tooltip
            className="w-max max-w-64"
            content={
              <span className="flex flex-col gap-1">
                {names.map((name, index) => (
                  <span key={`${post.targets[index]?.channelId}-${index}`}>
                    {name}
                  </span>
                ))}
              </span>
            }
            label={t("table.channelDetails")}
          >
            <span
              className="cursor-help text-muted-foreground underline decoration-dotted underline-offset-4"
              tabIndex={0}
            >
              {t("channels", { count: post.targets.length })}
            </span>
          </Tooltip>
        );
      },
    },
    {
      id: "date",
      header: t("table.date"),
      sortable: true,
      sortLabel: t("table.sortByDate"),
      cell: (post) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {date(post)}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("table.actions"),
      className: "text-right",
      headerClassName: "text-right",
      cell: actions,
    },
  ];
  if (!publications.length)
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {empty}
      </div>
    );
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(post) => post.id}
          header={
            <p className="text-sm text-muted-foreground">
              {t("pagination.results", { count: publications.length })}
            </p>
          }
          label={t("table.label")}
          sorting={sorting}
          onSortingChange={(nextSorting) => {
            setSorting(nextSorting);
            setPage(1);
          }}
        />
      </div>
      <div className="divide-y divide-border md:hidden">
        {visible.map((post) => (
          <article className="p-5" key={post.id}>
            <PublicationStatusBadge status={post.status} />
            <p className="mt-2 truncate font-semibold">
              {publicationDisplayTitle(post, t("mediaOnly"))}
            </p>
            {post.title && post.content && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {post.content}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {date(post)} · {t("channels", { count: post.targets.length })}
            </p>
            <div className="mt-3">{actions(post)}</div>
          </article>
        ))}
      </div>
      <Pagination
        labels={{
          perPage: t("pagination.pageSize"),
          navigation: t("pagination.navigation"),
          previous: t("pagination.previous"),
          next: t("pagination.next"),
          page: (number) => t("pagination.page", { number }),
        }}
        onPageChange={remotePagination?.onPageChange ?? setPage}
        onPageSizeChange={(size) => {
          if (remotePagination) remotePagination.onPageSizeChange(size);
          else {
            setPageSize(size);
            setPage(1);
          }
        }}
        page={currentPage}
        pageSize={activePageSize}
        totalResults={remotePagination?.total ?? publications.length}
      />
    </div>
  );
}
