import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthForm } from "../components/auth-form";
import { AuthLayout } from "../components/auth-layout";

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const [isVerifying, setIsVerifying] = useState(false);

  return (
    <AuthLayout title={t(isVerifying ? "verificationTitle" : "registerTitle")}>
      <AuthForm mode="register" onVerificationChange={setIsVerifying} />
    </AuthLayout>
  );
}
