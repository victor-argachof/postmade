import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { compactFieldActionClassName } from "@/features/auth/components/auth-action-styles";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { ROUTES } from "@/routes/route-paths";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import {
  createChangePasswordSchema,
  type ChangePasswordFormValues,
} from "../schemas/account-security-schemas";

export function ChangePasswordForm() {
  const { t } = useTranslation("account");
  const { t: tAuth } = useTranslation("auth");
  const provider = useAppSelector(
    (state) => state.auth.user?.identity.provider ?? "password"
  );
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const schema = useMemo(() => createChangePasswordSchema(t), [t]);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const newPassword = watch("newPassword") ?? "";

  if (provider === "google") {
    return (
      <div className="mt-8 flex gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <div>
          <p className="font-semibold">{t("googleManagedTitle")}</p>
          <p className="mt-1 leading-6 text-muted-foreground">
            {t("googlePasswordManagedDescription")}
          </p>
        </div>
      </div>
    );
  }

  const savePassword = () => {
    reset({ currentPassword: "", newPassword: "" });
    toast.success(t("passwordChangeSuccess"));
  };

  return (
    <form
      className="mt-8 space-y-5"
      noValidate
      onSubmit={handleSubmit(savePassword)}
    >
      <div>
        <span className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium" htmlFor="current-password">
            {t("currentPassword")}
          </label>
          <Link
            className={compactFieldActionClassName}
            to={ROUTES.forgotPassword}
          >
            {tAuth("forgotPassword")}
          </Link>
        </span>
        <div className="relative mt-2">
          <Input
            aria-describedby={
              errors.currentPassword ? "current-password-error" : undefined
            }
            aria-invalid={Boolean(errors.currentPassword)}
            autoComplete="current-password"
            className={`pr-11 ${errors.currentPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            {...register("currentPassword")}
          />
          <button
            aria-label={tAuth(
              showCurrentPassword ? "hidePassword" : "showPassword"
            )}
            aria-pressed={showCurrentPassword}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
            type="button"
            onClick={() => setShowCurrentPassword((visible) => !visible)}
          >
            {showCurrentPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p
            className="mt-2 text-xs text-red-600"
            id="current-password-error"
            role="alert"
          >
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="new-password">
          {t("newPassword")}
        </label>
        <div className="relative mt-2">
          <Input
            aria-describedby={`account-password-requirements account-password-strength${errors.newPassword ? " new-password-error" : ""}`}
            aria-invalid={Boolean(errors.newPassword)}
            autoComplete="new-password"
            className={`pr-11 ${errors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            {...register("newPassword")}
          />
          <button
            aria-label={tAuth(
              showNewPassword ? "hidePassword" : "showPassword"
            )}
            aria-pressed={showNewPassword}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
            type="button"
            onClick={() => setShowNewPassword((visible) => !visible)}
          >
            {showNewPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p
            className="mt-2 text-xs text-red-600"
            id="new-password-error"
            role="alert"
          >
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <PasswordStrength idPrefix="account-password" password={newPassword} />

      <div>
        <Button className="w-full sm:w-auto" type="submit">
          {t("updatePassword")}
        </Button>
      </div>
    </form>
  );
}
