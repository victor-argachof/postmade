import { useEffect, useState } from "react";
import { Toaster } from "sonner";

function getCurrentTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function AppToaster() {
  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getCurrentTheme()));
    observer.observe(document.documentElement, { attributeFilter: ["class"], attributes: true });
    return () => observer.disconnect();
  }, []);

  return <Toaster closeButton position="bottom-right" richColors theme={theme} />;
}
