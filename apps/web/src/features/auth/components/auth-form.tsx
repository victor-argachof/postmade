import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "@/routes/route-paths";
import { api } from "@/shared/api/api";
import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAppDispatch } from "@/shared/hooks/store-hooks";

import { createAuthSchema, type AuthFormValues } from "../schemas/auth-schemas";
import {
  useLoginStartMutation,
  useLoginVerifyMutation,
  useRegisterStartMutation,
  useRegisterVerifyMutation,
  useResendCodeMutation,
} from "../services/auth-api";
import { setSession } from "../store/auth-slice";
import { compactFieldActionClassName } from "./auth-action-styles";
import { EmailVerificationForm } from "./email-verification-form";
import { PasswordStrength } from "./password-strength";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.32 2.98-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  onVerificationChange,
}: {
  mode: "login" | "register";
  onVerificationChange?: (isVerifying: boolean) => void;
}) {
  const { t } = useTranslation("auth");
  const { t: tApiError } = useTranslation("apiErrors");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("invite");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingCredentials, setPendingCredentials] =
    useState<AuthFormValues | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [registerStart] = useRegisterStartMutation();
  const [registerVerify] = useRegisterVerifyMutation();
  const [loginStart] = useLoginStartMutation();
  const [loginVerify] = useLoginVerifyMutation();
  const [resendCode] = useResendCodeMutation();
  const [authenticationError, setAuthenticationError] = useState<string | null>(
    null
  );
  const isRegister = mode === "register";
  const schema = useMemo(
    () => createAuthSchema(t, isRegister),
    [isRegister, t]
  );
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const password = useWatch({ control, name: "password" }) ?? "";

  const submitCredentials = async (values: AuthFormValues) => {
    try {
      const challenge = isRegister
        ? await registerStart({
            name: values.name ?? "",
            email: values.email,
            password: values.password,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }).unwrap()
        : await loginStart({
            email: values.email,
            password: values.password,
          }).unwrap();
      setAuthenticationError(null);
      setPendingCredentials(values);
      setChallengeId(challenge.challengeId);
      onVerificationChange?.(true);
    } catch (error) {
      setAuthenticationError(tApiError(getApiErrorTranslationKey(error)));
    }
  };

  const completeEmailAuthentication = async ({ code }: { code: string }) => {
    if (!challengeId) return;
    try {
      const user = isRegister
        ? await registerVerify({ challengeId, code }).unwrap()
        : await loginVerify({ challengeId, code }).unwrap();
      dispatch(
        setSession({
          ...user,
          identity: { ...user.identity, providerSubject: user.id },
        })
      );
      dispatch(api.util.invalidateTags([]));
      navigate(ROUTES.dashboard);
    } catch (error) {
      setAuthenticationError(tApiError(getApiErrorTranslationKey(error)));
    }
  };

  const handleGoogleSignIn = () => {
    setAuthenticationError(
      t("googleUnavailable", {
        defaultValue:
          "O login com Google estará disponível em uma próxima etapa.",
      })
    );
  };

  if (pendingCredentials) {
    return (
      <EmailVerificationForm
        email={pendingCredentials.email}
        onBack={() => {
          setPendingCredentials(null);
          onVerificationChange?.(false);
        }}
        onVerified={completeEmailAuthentication}
        onResend={() =>
          challengeId
            ? resendCode({ challengeId })
                .unwrap()
                .then(() => undefined)
            : undefined
        }
      />
    );
  }

  return (
    <form
      className="mt-8 space-y-5"
      noValidate
      onSubmit={handleSubmit(submitCredentials)}
    >
      <Button
        className="w-full"
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon />
        {t(isRegister ? "registerWithGoogle" : "loginWithGoogle")}
      </Button>

      <div className="flex items-center gap-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        <span>{t("orContinueWithEmail")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {authenticationError && (
        <p
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700"
          role="alert"
        >
          {authenticationError}
        </p>
      )}

      {isRegister && (
        <div>
          <label className="block text-sm font-medium" htmlFor="auth-name">
            {t("fullName")}
          </label>
          <Input
            aria-describedby={errors.name ? "auth-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            className={`mt-2 ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            id="auth-name"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <p
              className="mt-2 text-xs text-red-600"
              id="auth-name-error"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium" htmlFor="auth-email">
          {t("email")}
        </label>
        <Input
          aria-describedby={errors.email ? "auth-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          className={`mt-2 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
          id="auth-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p
            className="mt-2 text-xs text-red-600"
            id="auth-email-error"
            role="alert"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <span className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium" htmlFor="auth-password">
            {t("password")}
          </label>
          {!isRegister && (
            <Link
              className={compactFieldActionClassName}
              to={ROUTES.forgotPassword}
            >
              {t("forgotPassword")}
            </Link>
          )}
        </span>
        <div className="relative mt-2">
          <Input
            aria-describedby={
              isRegister
                ? `password-requirements password-strength${errors.password ? " auth-password-error" : ""}`
                : errors.password
                  ? "auth-password-error"
                  : undefined
            }
            aria-invalid={Boolean(errors.password)}
            className={`pr-11 ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            id="auth-password"
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            {...register("password")}
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
        {errors.password && (
          <p
            className="mt-2 text-xs text-red-600"
            id="auth-password-error"
            role="alert"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {isRegister && <PasswordStrength password={password} />}

      {isRegister && (
        <p className="text-center text-xs leading-5 text-muted-foreground">
          <Trans
            components={{
              terms: (
                <a
                  className="font-semibold text-foreground hover:text-primary hover:underline"
                  href={ROUTES.termsOfUse}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              ),
              privacy: (
                <a
                  className="font-semibold text-foreground hover:text-primary hover:underline"
                  href={ROUTES.privacyPolicy}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              ),
            }}
            i18nKey="registrationAgreement"
            ns="auth"
          />
        </p>
      )}

      <Button className="w-full" type="submit">
        {t(
          invitationToken && isRegister
            ? "joinWorkspace"
            : isRegister
              ? "startFreeTrial"
              : "login"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t(isRegister ? "hasAccount" : "noAccount")}{" "}
        <Link
          className="font-semibold text-primary hover:underline"
          to={`${isRegister ? ROUTES.login : ROUTES.register}${invitationToken ? `?invite=${encodeURIComponent(invitationToken)}` : ""}`}
        >
          {t(isRegister ? "login" : "register")}
        </Link>
      </p>
    </form>
  );
}
