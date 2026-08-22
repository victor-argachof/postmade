import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/routes/route-paths";
import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { centeredBackActionClassName } from "../components/auth-action-styles";
import { AuthLayout } from "../components/auth-layout";
import { PasswordStrength } from "../components/password-strength";
import {
  createForgotPasswordSchema,
  createResetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "../schemas/auth-schemas";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "../services/auth-api";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { t: tApiError } = useTranslation("apiErrors");
  const navigate = useNavigate();
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [forgotPassword] = useForgotPasswordMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [challengeId, setChallengeId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);
  const resetSchema = useMemo(() => createResetPasswordSchema(t), [t]);
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
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    control: resetControl,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const newPassword = useWatch({ control: resetControl, name: "password" });
  const codeField = registerReset("code");

  return (
    <AuthLayout title={t("forgotPasswordTitle")}>
      {!challengeId && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("forgotPasswordDescription")}
        </p>
      )}

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
          noValidate
          onSubmit={handleResetSubmit(async ({ code, password }) => {
            try {
              await resetPassword({ challengeId, code, password }).unwrap();
              setResetError(null);
              navigate(ROUTES.login, { replace: true });
              toast.success(t("passwordResetSuccess"));
            } catch (error) {
              setResetError(tApiError(getApiErrorTranslationKey(error)));
            }
          })}
        >
          <>
            <p className="text-sm text-muted-foreground">
              {t("resetPasswordInstructions", { email: submittedEmail })}
            </p>
            <div>
              <label className="block text-sm font-medium" htmlFor="reset-code">
                {t("verificationCode")}
              </label>
              <Input
                {...codeField}
                aria-describedby={
                  resetErrors.code ? "reset-code-error" : undefined
                }
                aria-invalid={Boolean(resetErrors.code)}
                className={`mt-2 ${resetErrors.code ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                id="reset-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => {
                  setResetError(null);
                  event.target.value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
                  void codeField.onChange(event);
                }}
              />
              {resetErrors.code && (
                <p
                  className="mt-2 text-xs text-red-600"
                  id="reset-code-error"
                  role="alert"
                >
                  {resetErrors.code.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="new-password"
              >
                {t("newPassword")}
              </label>
              <div className="relative mt-2">
                <Input
                  aria-describedby={`reset-password-requirements reset-password-strength${resetErrors.password ? " reset-password-error" : ""}`}
                  aria-invalid={Boolean(resetErrors.password)}
                  className={`pr-11 ${resetErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerReset("password", {
                    onChange: () => setResetError(null),
                  })}
                />
                <button
                  aria-label={t(showPassword ? "hidePassword" : "showPassword")}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
              {resetErrors.password && (
                <p
                  className="mt-2 text-xs text-red-600"
                  id="reset-password-error"
                  role="alert"
                >
                  {resetErrors.password.message}
                </p>
              )}
            </div>
            <PasswordStrength
              idPrefix="reset-password"
              password={newPassword}
            />
            {resetError && (
              <p
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700"
                role="alert"
              >
                {resetError}
              </p>
            )}
            <Button className="w-full" type="submit">
              {t("resetPassword")}
            </Button>
          </>
          <Link className={centeredBackActionClassName} to={ROUTES.login}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("backToLogin")}
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
