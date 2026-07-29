import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/routes/route-paths";

const footerLinks = [
  { href: ROUTES.termsOfUse, labelKey: "footer.termsOfUse" },
  { href: ROUTES.privacyPolicy, labelKey: "footer.privacyPolicy" },
  { href: "mailto:support@postmade.app", labelKey: "footer.support" },
] as const;

export function AppFooter() {
  const { t } = useTranslation("common");

  return (
    <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
        <p className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
          <span>© 2026 - {t("footer.madeWith")}</span>
          <Heart className="size-3.5 fill-primary text-primary" aria-label={t("footer.love")} />
          <span>{t("footer.byTeam")}</span>
        </p>
        <nav aria-label={t("footer.navigationLabel")}>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-end">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  className="transition-colors hover:text-foreground hover:underline"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(link.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
