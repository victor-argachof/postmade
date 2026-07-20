import { useTranslation } from "react-i18next";
import { AuthForm } from "../components/auth-form";
import { AuthLayout } from "../components/auth-layout";

export function LoginPage() {
  const { t } = useTranslation("auth");
  return <AuthLayout title={t("loginTitle")}><AuthForm mode="login" /></AuthLayout>;
}
