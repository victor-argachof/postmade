import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

type PageItem = number | "ellipsis";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items: PageItem[] = [];
  validPages.forEach((page, index) => {
    if (index > 0 && page - validPages[index - 1]! > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}

export interface PaginationLabels {
  perPage: string;
  navigation: string;
  previous: string;
  next: string;
  page: (page: number) => string;
}

export function Pagination({
  labels,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  totalResults,
}: {
  labels: PaginationLabels;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalResults: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageSizeLabelId = useId();

  return (
    <div className="flex flex-col items-center gap-5 border-t border-border px-4 py-5 text-sm text-muted-foreground lg:flex-row lg:justify-between lg:px-5 lg:py-4">
      <div className="flex items-center justify-center gap-2">
        <span id={pageSizeLabelId}>{labels.perPage}</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="w-20" aria-labelledby={pageSizeLabelId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {pageSizeOptions.map((option) => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <nav className="flex w-full items-center justify-center gap-1 lg:w-auto" aria-label={labels.navigation}>
        <Button aria-label={labels.previous} disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)} size="icon" type="button" variant="ghost">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        {getPageItems(safePage, totalPages).map((item, index) => item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="flex size-9 items-center justify-center text-muted-foreground" aria-hidden="true">…</span>
        ) : (
          <Button
            key={item}
            aria-current={item === safePage ? "page" : undefined}
            aria-label={labels.page(item)}
            className="size-9 px-0"
            onClick={() => onPageChange(item)}
            size="sm"
            type="button"
            variant={item === safePage ? "default" : "ghost"}
          >
            {item}
          </Button>
        ))}
        <Button aria-label={labels.next} disabled={safePage === totalPages} onClick={() => onPageChange(safePage + 1)} size="icon" type="button" variant="ghost">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}
