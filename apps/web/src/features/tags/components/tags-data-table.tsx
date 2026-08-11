import type { TagGroup } from "@postmade/types";
import { Edit3, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table";
import { Pagination } from "@/shared/components/pagination";
import { Button } from "@/shared/components/ui/button";

export function TagsDataTable({
  canManage,
  empty,
  groups,
  onDelete,
  onEdit,
  resetKey,
}: {
  canManage: boolean;
  empty: ReactNode;
  groups: TagGroup[];
  onDelete: (group: TagGroup) => void;
  onEdit: (group: TagGroup) => void;
  resetKey: string;
}) {
  const { t } = useTranslation("tags");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  useEffect(
    () => setPage((current) => Math.min(current, totalPages)),
    [totalPages]
  );
  useEffect(() => setPage(1), [resetKey]);
  const visible = groups.slice((page - 1) * pageSize, page * pageSize);
  const actions = (group: TagGroup) => (
    <div className="flex justify-end gap-1">
      <Button
        aria-label={t("actions.editNamed", { name: group.name })}
        disabled={!canManage}
        size="icon"
        type="button"
        variant="ghost"
        onClick={() => onEdit(group)}
      >
        <Edit3 className="size-4" />
      </Button>
      <Button
        aria-label={t("actions.deleteNamed", { name: group.name })}
        disabled={!canManage}
        size="icon"
        type="button"
        variant="ghost"
        onClick={() => onDelete(group)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
  const tags = (group: TagGroup) => (
    <div className="flex max-w-xl flex-wrap gap-1.5">
      {group.tags.map((tag) => (
        <span
          className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
          key={tag.toLocaleLowerCase()}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
  const columns: DataTableColumn<TagGroup>[] = [
    {
      id: "name",
      header: t("table.name"),
      cell: (group) => <span className="font-semibold">{group.name}</span>,
    },
    { id: "tags", header: t("table.tags"), cell: tags },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      className: "text-right",
      headerClassName: "text-right",
      cell: actions,
    },
  ];
  if (!groups.length)
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {empty}
      </div>
    );
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(group) => group.id}
          header={
            <p className="text-sm text-muted-foreground">
              {t("table.results", { count: groups.length })}
            </p>
          }
          label={t("table.label")}
        />
      </div>
      <div className="divide-y divide-border md:hidden">
        {visible.map((group) => (
          <article className="p-5" key={group.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold">{group.name}</h2>
              {actions(group)}
            </div>
            <div className="mt-3">{tags(group)}</div>
          </article>
        ))}
      </div>
      <Pagination
        labels={{
          perPage: t("pagination.perPage"),
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
        totalResults={groups.length}
      />
    </div>
  );
}
