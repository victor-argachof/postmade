import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { ThemeToggle } from "@/shared/components/theme-toggle";

export function MobilePreferences() {
  const { t } = useTranslation("common");

  return (
    <section
      className="mt-auto border-t border-border px-2 pt-4"
      aria-label={t("preferences")}
    >
      <p className="px-2 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("preferences")}
      </p>
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t("theme")}
        </span>
        <ThemeToggle />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t("language")}
        </span>
        <LanguageSwitcher placement="top" />
      </div>
    </section>
  );
}
