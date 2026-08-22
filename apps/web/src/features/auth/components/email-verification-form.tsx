import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import {
  createVerificationCodeSchema,
  type VerificationCodeFormValues,
} from "../schemas/auth-schemas";
import { centeredBackActionClassName } from "./auth-action-styles";

export function EmailVerificationForm({
  email,
  error,
  onErrorDismiss,
  onBack,
  onVerified,
  onResend,
  showBackAction = true,
}: {
  email: string;
  error?: string | null;
  onErrorDismiss?: () => void;
  onBack: () => void;
  onVerified: (values: VerificationCodeFormValues) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
  showBackAction?: boolean;
}) {
  const { t } = useTranslation("auth");
  const { t: tApiError } = useTranslation("apiErrors");
  const [codeResent, setCodeResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(60);
  const schema = useMemo(() => createVerificationCodeSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationCodeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const codeField = register("code");
  const resendTimer = `${String(Math.floor(resendSeconds / 60)).padStart(2, "0")}:${String(resendSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (resendSeconds === 0) return;

    const timeout = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);

    return () => window.clearTimeout(timeout);
  }, [resendSeconds]);

  const handleResendCode = async () => {
    try {
      await onResend?.();
      setResendError(null);
      setCodeResent(true);
      setResendSeconds(60);
    } catch (error) {
      setCodeResent(false);
      setResendError(tApiError(getApiErrorTranslationKey(error)));
    }
  };

  return (
    <>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {t("verificationDescription", { email })}
      </p>

      <form
        className="mt-8 space-y-5"
        noValidate
        onSubmit={handleSubmit(onVerified)}
      >
        <div>
          <label
            className="block text-sm font-medium"
            htmlFor="verification-code"
          >
            {t("verificationCode")}
          </label>
          <Input
            {...codeField}
            aria-describedby={
              [
                errors.code ? "verification-code-error" : null,
                error ? "verification-api-error" : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={Boolean(errors.code || error)}
            autoComplete="one-time-code"
            className={`mt-2 text-center text-2xl font-bold tracking-[0.45em] ${errors.code ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            id="verification-code"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => {
              onErrorDismiss?.();
              event.target.value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);
              void codeField.onChange(event);
            }}
          />
          {errors.code && (
            <p
              className="mt-2 text-xs text-red-600"
              id="verification-code-error"
              role="alert"
            >
              {errors.code.message}
            </p>
          )}
          {error && (
            <p
              className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700"
              id="verification-api-error"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Button className="w-full" type="submit">
            {t("validateCode")}
          </Button>
          <Button
            className="w-full bg-muted/70 text-foreground hover:bg-muted"
            disabled={resendSeconds > 0}
            type="button"
            variant="outline"
            onClick={handleResendCode}
          >
            {resendSeconds > 0
              ? t("resendCodeCountdown", { time: resendTimer })
              : t("resendCode")}
          </Button>
        </div>

        {codeResent && (
          <p
            className="text-center text-xs font-medium text-emerald-700 dark:text-emerald-400"
            role="status"
          >
            {t("codeResent")}
          </p>
        )}

        {resendError && (
          <p className="text-center text-xs font-medium text-red-600" role="alert">
            {resendError}
          </p>
        )}

        {showBackAction && (
          <button
            className={centeredBackActionClassName}
            type="button"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("changeEmail")}
          </button>
        )}
      </form>
    </>
  );
}
