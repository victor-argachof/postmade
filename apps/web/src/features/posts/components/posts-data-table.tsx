import type { ScheduledPublication } from "@postmade/types";
import { Copy, Edit3, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table";
import { Pagination } from "@/shared/components/pagination";
import { Button } from "@/shared/components/ui/button";

import { PublicationStatusBadge } from "./publication-status-badge";

type Action = "delete" | "cancel" | "duplicate" | "retry";

export function PostsDataTable({
  canManage,
  empty,
  locale,
  onAction,
  onEdit,
  publications,
  resetKey,
  timezone,
}: {
  canManage: boolean;
  empty: ReactNode;
  locale: string;
  onAction: (action: Action, id: string) => void;
  onEdit: (id: string) => void;
  publications: ScheduledPublication[];
  resetKey: string;
  timezone: string;
}) {
  const { t } = useTranslation("posts");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(publications.length / pageSize));
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages]
  );
  useEffect(() => setPage(1), [resetKey]);
  const visible = publications.slice((page - 1) * pageSize, page * pageSize);
  const date = (post: ScheduledPublication) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(
      new Date(post.scheduledFor ?? post.publishedAt ?? post.createdAt)
    );
  const actions = (post: ScheduledPublication) => (
    <div className="flex flex-wrap justify-end gap-1">
      {canManage && !["published", "publishing"].includes(post.status) && (
        <Button
          aria-label={t("actions.edit")}
          size="icon"
          variant="ghost"
          onClick={() => onEdit(post.id)}
        >
          <Edit3 className="size-4" />
        </Button>
      )}
      {canManage && (
        <Button
          aria-label={t("actions.duplicate")}
          size="icon"
          variant="ghost"
          onClick={() => onAction("duplicate", post.id)}
        >
          <Copy className="size-4" />
        </Button>
      )}
      {canManage && post.status === "scheduled" && (
        <Button
          aria-label={t("actions.cancel")}
          size="icon"
          variant="ghost"
          onClick={() => onAction("cancel", post.id)}
        >
          <XCircle className="size-4" />
        </Button>
      )}
      {canManage && post.status === "failed" && (
        <Button
          aria-label={t("actions.retry")}
          size="icon"
          variant="ghost"
          onClick={() => onAction("retry", post.id)}
        >
          <RotateCcw className="size-4" />
        </Button>
      )}
      {canManage && !["published", "publishing"].includes(post.status) && (
        <Button
          aria-label={t("actions.delete")}
          size="icon"
          variant="ghost"
          onClick={() => onAction("delete", post.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
  const columns: DataTableColumn<ScheduledPublication>[] = [
    {
      id: "publication",
      header: t("table.publication"),
      cell: (post) => (
        <div className="min-w-52">
          <PublicationStatusBadge status={post.status} />
          <p className="mt-2 max-w-md truncate font-semibold">
            {post.content || t("mediaOnly")}
          </p>
        </div>
      ),
    },
    {
      id: "channels",
      header: t("table.channels"),
      cell: (post) => (
        <span className="text-muted-foreground">
          {post.targets.length} {t("channels")}
        </span>
      ),
    },
    {
      id: "date",
      header: t("table.date"),
      cell: (post) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {date(post)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
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
        />
      </div>
      <div className="divide-y divide-border md:hidden">
        {visible.map((post) => (
          <article className="p-5" key={post.id}>
            <PublicationStatusBadge status={post.status} />
            <p className="mt-2 truncate font-semibold">
              {post.content || t("mediaOnly")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {date(post)} · {post.targets.length} {t("channels")}
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
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        page={page}
        pageSize={pageSize}
        totalResults={publications.length}
      />
    </div>
  );
}
