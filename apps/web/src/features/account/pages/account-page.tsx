import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ChangeEmailForm } from "../components/change-email-form";
import { ChangePasswordForm } from "../components/change-password-form";
import { ProfileForm } from "../components/profile-form";
import { PageHeader } from "@/shared/components/page-header";

export function AccountPage() {
  const { t } = useTranslation("account");

  return (
    <section className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Postmade" title={t("pageTitle")} description={t("pageDescription")} />

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

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("emailTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("emailDescription")}</p>
          </div>
        </div>
        <ChangeEmailForm />
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{t("securityTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("securityDescription")}</p>
          </div>
        </div>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
