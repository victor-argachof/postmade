import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/components/ui/button";

export function ThemeToggle() {
  const { t } = useTranslation("common");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t(isDark ? "useLightTheme" : "useDarkTheme")}
      title={t(isDark ? "useLightTheme" : "useDarkTheme")}
    >
      {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </Button>
  );
}
