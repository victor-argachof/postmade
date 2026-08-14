import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortLabel?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableSorting {
  columnId: string;
  direction: "asc" | "desc";
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  header,
  label,
  onSortingChange,
  sorting,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  header?: ReactNode;
  label: string;
  onSortingChange?: (sorting?: DataTableSorting) => void;
  sorting?: DataTableSorting;
}) {
  return (
    <>
      {header && (
        <div className="border-b border-border px-5 py-3">{header}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm" aria-label={label}>
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  aria-sort={
                    column.sortable
                      ? sorting?.columnId === column.id
                        ? sorting.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  key={column.id}
                  className={cn(
                    "h-12 px-5 text-left align-middle text-xs font-bold tracking-wider text-muted-foreground uppercase",
                    column.headerClassName
                  )}
                  scope="col"
                >
                  {column.sortable && onSortingChange ? (
                    <button
                      aria-label={column.sortLabel}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      type="button"
                      onClick={() => {
                        if (
                          sorting?.columnId === column.id &&
                          sorting.direction === "desc"
                        ) {
                          onSortingChange(undefined);
                          return;
                        }
                        onSortingChange({
                          columnId: column.id,
                          direction:
                            sorting?.columnId === column.id ? "desc" : "asc",
                        });
                      }}
                    >
                      {column.header}
                      {sorting?.columnId !== column.id ? (
                        <ChevronsUpDown
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      ) : sorting.direction === "asc" ? (
                        <ChevronUp className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr
                key={getRowId(row)}
                className="transition-colors hover:bg-muted/35"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn("px-5 py-4 align-middle", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
