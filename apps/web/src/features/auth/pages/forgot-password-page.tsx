import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { centeredBackActionClassName } from "../components/auth-action-styles";
import { AuthLayout } from "../components/auth-layout";
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/auth-schemas";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "../services/auth-api";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [forgotPassword] = useForgotPasswordMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordReset, setPasswordReset] = useState(false);
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  return (
    <AuthLayout title={t("forgotPasswordTitle")}>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {t("forgotPasswordDescription")}
      </p>

      {!challengeId ? (
        <form
          className="mt-8 space-y-5"
          noValidate
          onSubmit={handleSubmit(async ({ email }) => {
            const challenge = await forgotPassword({ email }).unwrap();
            setSubmittedEmail(email);
            setChallengeId(challenge.challengeId);
          })}
        >
          <div>
            <label className="block text-sm font-medium" htmlFor="reset-email">
              {t("email")}
            </label>
            <Input
              aria-describedby={errors.email ? "reset-email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              className={`mt-2 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
              id="reset-email"
              type="email"
              autoComplete="email"
              {...register("email", { onChange: () => setSubmittedEmail("") })}
            />
            {errors.email && (
              <p
                className="mt-2 text-xs text-red-600"
                id="reset-email-error"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {submittedEmail && (
            <div
              className="flex gap-3 rounded-xl border border-green-600/20 bg-green-600/10 p-3 text-sm"
              role="status"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-green-600"
              />
              <div>
                <p className="font-semibold">{t("resetLinkSentTitle")}</p>
                <p className="mt-1 text-muted-foreground">
                  {t("resetInstructionsSent")}
                </p>
              </div>
            </div>
          )}

          <Button className="w-full" type="submit">
            {t(submittedEmail ? "resendResetLink" : "sendResetLink")}
          </Button>

          <Link className={centeredBackActionClassName} to={ROUTES.login}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("backToLogin")}
          </Link>
        </form>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await resetPassword({
              challengeId,
              code,
              password: newPassword,
            }).unwrap();
            setPasswordReset(true);
          }}
        >
          {passwordReset ? (
            <div
              className="rounded-xl border border-green-600/20 bg-green-600/10 p-3 text-sm"
              role="status"
            >
              Senha redefinida com sucesso.
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Digite o código enviado para {submittedEmail} e escolha uma nova
                senha.
              </p>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="reset-code"
                >
                  Código de verificação
                </label>
                <Input
                  className="mt-2"
                  id="reset-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="new-password"
                >
                  Nova senha
                </label>
                <Input
                  className="mt-2"
                  id="new-password"
                  type="password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <Button className="w-full" type="submit">
                Redefinir senha
              </Button>
            </>
          )}
          <Link className={centeredBackActionClassName} to={ROUTES.login}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("backToLogin")}
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
