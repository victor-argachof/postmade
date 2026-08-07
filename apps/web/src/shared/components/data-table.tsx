import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  header,
  label,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  header?: ReactNode;
  label: string;
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
                  key={column.id}
                  className={cn(
                    "h-12 px-5 text-left align-middle text-xs font-bold tracking-wider text-muted-foreground uppercase",
                    column.headerClassName
                  )}
                  scope="col"
                >
                  {column.header}
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
