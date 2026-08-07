import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";
import { Brand } from "@/shared/components/brand";
import { LanguageSwitcher } from "@/shared/components/language-switcher";

export function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/50 p-5">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl shadow-black/5 sm:p-10">
        <div className="flex items-center justify-between">
          <Link to={ROUTES.home}>
            <Brand />
          </Link>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-10 text-3xl font-black tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}
