import { useTranslation } from "react-i18next";

import { SearchInput } from "@/shared/components/search-input";

export function TagsFilters({
  onQueryChange,
  query,
}: {
  onQueryChange: (query: string) => void;
  query: string;
}) {
  const { t } = useTranslation("tags");
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <SearchInput
        aria-label={t("filters.search")}
        clearLabel={t("filters.clear")}
        placeholder={t("filters.placeholder")}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange("")}
      />
    </div>
  );
}
