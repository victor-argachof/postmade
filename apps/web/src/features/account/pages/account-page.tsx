import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ChangeEmailForm } from "../components/change-email-form";
import { ChangePasswordForm } from "../components/change-password-form";
import { ProfileForm } from "../components/profile-form";
import { PageHeader } from "@/shared/components/page-header";
import { SectionCard } from "@/shared/components/section-card";

export function AccountPage() {
  const { t } = useTranslation("account");

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      <SectionCard
        className="mt-10"
        icon={UserRound}
        title={t("profileTitle")}
        description={t("profileDescription")}
      >
        <ProfileForm />
      </SectionCard>

      <SectionCard
        className="mt-6"
        icon={Mail}
        title={t("emailTitle")}
        description={t("emailDescription")}
      >
        <ChangeEmailForm />
      </SectionCard>

      <SectionCard
        className="mt-6"
        icon={ShieldCheck}
        title={t("securityTitle")}
        description={t("securityDescription")}
      >
        <ChangePasswordForm />
      </SectionCard>
    </section>
  );
}
