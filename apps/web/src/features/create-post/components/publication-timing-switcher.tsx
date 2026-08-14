import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Switch } from "@/shared/components/ui/switch";

export type PublicationTimingMode = "immediate" | "scheduled";

export function PublicationTimingSwitcher({
  children,
  disabled,
  onChange,
  value,
}: {
  children?: ReactNode;
  disabled?: boolean;
  onChange: (mode: PublicationTimingMode) => void;
  value: PublicationTimingMode;
}) {
  const { t } = useTranslation("createPost");
  const scheduled = value === "scheduled";
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <label
            className="cursor-pointer text-sm font-bold"
            htmlFor="publication-scheduling"
          >
            {t("composer.timing.toggleLabel")}
          </label>
        </div>
        <Switch
          aria-label={t("composer.timing.question")}
          checked={scheduled}
          disabled={disabled}
          id="publication-scheduling"
          onCheckedChange={(checked) =>
            onChange(checked ? "scheduled" : "immediate")
          }
        />
      </div>
      {scheduled && children && (
        <div className="mt-4 border-t border-border pt-4">{children}</div>
      )}
    </div>
  );
}
