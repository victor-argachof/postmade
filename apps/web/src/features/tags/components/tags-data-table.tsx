import type { TagGroup } from "@postmade/types";
import { Edit3, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  type DataTableColumn,
  type DataTableError,
  type DataTableSorting,
} from "@/shared/components/data-table";
import { Pagination } from "@/shared/components/pagination";
import { Button } from "@/shared/components/ui/button";

export function TagsDataTable({
  canManage,
  empty,
  error,
  groups,
  onDelete,
  onEdit,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  page,
  pageSize,
  sorting,
  totalResults,
}: {
  canManage: boolean;
  empty: ReactNode;
  error?: DataTableError;
  groups: TagGroup[];
  onDelete: (group: TagGroup) => void;
  onEdit: (group: TagGroup) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSortingChange: (sorting: DataTableSorting | undefined) => void;
  page: number;
  pageSize: number;
  sorting: DataTableSorting | undefined;
  totalResults: number;
}) {
  const { t } = useTranslation("tags");
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = groups;
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
      sortable: true,
      sortLabel: t("table.sortByName"),
      cell: (group) => <span className="font-semibold">{group.name}</span>,
    },
    {
      id: "tags",
      header: t("table.tags"),
      className: "min-w-80",
      headerClassName: "min-w-80",
      sortable: true,
      sortLabel: t("table.sortByTags"),
      cell: tags,
    },
    {
      id: "actions",
      header: t("table.actions"),
      className: "text-right",
      headerClassName: "text-right",
      cell: actions,
    },
  ];
  if (!groups.length && !error)
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {empty}
      </div>
    );
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <DataTable
        columns={columns}
        data={visible}
        error={error}
        getRowId={(group) => group.id}
        header={
          <p className="text-sm text-muted-foreground">
            {t("table.results", { count: totalResults })}
          </p>
        }
        label={t("table.label")}
        sorting={sorting}
        onSortingChange={onSortingChange}
      />
      {!error && (
        <Pagination
          labels={{
            perPage: t("pagination.perPage"),
            navigation: t("pagination.navigation"),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: (number) => t("pagination.page", { number }),
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
