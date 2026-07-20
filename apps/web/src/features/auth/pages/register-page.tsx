import { useTranslation } from "react-i18next";
import { AuthForm } from "../components/auth-form";
import { AuthLayout } from "../components/auth-layout";

export function RegisterPage() {
  const { t } = useTranslation("auth");
  return <AuthLayout title={t("registerTitle")}><AuthForm mode="register" /></AuthLayout>;
}
