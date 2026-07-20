import { Check, ChevronDown, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDismissibleDetails } from "@/shared/hooks/use-dismissible-details";
import { supportedLanguages, type SupportedLanguage } from "@/shared/i18n/languages";
import { cn } from "@/shared/lib/utils";

export function LanguageSwitcher({ placement = "bottom" }: { placement?: "top" | "bottom" }) {
  const { i18n, t } = useTranslation("common");
  const menuRef = useDismissibleDetails();
  const currentLanguage =
    supportedLanguages.find(({ code }) => code === i18n.resolvedLanguage) ??
    supportedLanguages[0];

  const selectLanguage = (language: SupportedLanguage) => {
    window.localStorage.setItem("postmade.language", language.code);
    void i18n.changeLanguage(language.code);
    menuRef.current?.removeAttribute("open");
  };

  return (
    <details ref={menuRef} className="group/language relative">
      <summary
        className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-semibold outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
        aria-label={t("selectLanguage")}
        title={t("selectLanguage")}
      >
        <Languages className="size-4" aria-hidden="true" />
        <span>{currentLanguage?.shortLabel}</span>
        <ChevronDown className="size-3.5 transition-transform group-open/language:rotate-180" aria-hidden="true" />
      </summary>
      <div
        className={cn(
          "absolute right-0 z-50 w-52 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/10",
          placement === "top" ? "bottom-full mb-2" : "mt-2",
        )}
      >
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("language")}
        </p>
        {supportedLanguages.map((language) => {
          const isSelected = language.code === currentLanguage?.code;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => selectLanguage(language)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              lang={language.code}
              aria-current={isSelected ? "true" : undefined}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-muted-foreground">{language.shortLabel}</span>
                {language.nativeName}
              </span>
              {isSelected && <Check className="size-4 text-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </details>
  );
}
