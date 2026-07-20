import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProfileForm } from "../components/profile-form";

export function AccountPage() {
  const { t } = useTranslation("account");

  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Postmade</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight">{t("pageTitle")}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        {t("pageDescription")}
      </p>

      <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("profileTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("profileDescription")}</p>
          </div>
        </div>
        <ProfileForm />
      </div>
    </section>
  );
}
