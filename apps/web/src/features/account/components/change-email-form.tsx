import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateProfile } from "@/features/auth/store/auth-slice";
import { updateMemberIdentity } from "@/features/workspaces/store/workspaces-slice";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import {
  createChangeEmailSchema,
  type ChangeEmailFormValues,
} from "../schemas/account-security-schemas";
import { ChangeEmailVerificationModal } from "./overlays/modals/change-email-verification-modal";

export function ChangeEmailForm() {
  const { t } = useTranslation("account");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentEmail = user?.email ?? "user@postmade.app";
  const provider = user?.identity.provider ?? "password";
  const [pendingEmail, setPendingEmail] = useState("");
  const schema = useMemo(
    () => createChangeEmailSchema(t, currentEmail),
    [currentEmail, t]
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newEmail: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset({ newEmail: "" });
  }, [currentEmail, reset]);

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
            {t("googleEmailManagedDescription")}
          </p>
        </div>
      </div>
    );
  }

  const completeEmailChange = () => {
    if (!pendingEmail) return;

    dispatch(updateProfile({ email: pendingEmail }));
    if (user)
      dispatch(updateMemberIdentity({ userId: user.id, email: pendingEmail }));
    setPendingEmail("");
    toast.success(t("emailChangeSuccess"));
  };

  return (
    <>
      <form
        className="mt-8 space-y-5"
        noValidate
        onSubmit={handleSubmit(({ newEmail }) => {
          setPendingEmail(newEmail);
        })}
      >
        <div>
          <label className="block text-sm font-medium" htmlFor="current-email">
            {t("currentEmail")}
          </label>
          <Input
            className="mt-2 cursor-not-allowed bg-muted/50 text-muted-foreground"
            id="current-email"
            readOnly
            type="email"
            value={currentEmail}
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="new-email">
            {t("newEmail")}
          </label>
          <Input
            aria-describedby={errors.newEmail ? "new-email-error" : undefined}
            aria-invalid={Boolean(errors.newEmail)}
            autoComplete="email"
            className={`mt-2 ${errors.newEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            id="new-email"
            type="email"
            {...register("newEmail")}
          />
          {errors.newEmail && (
            <p
              className="mt-2 text-xs text-red-600"
              id="new-email-error"
              role="alert"
            >
              {errors.newEmail.message}
            </p>
          )}
        </div>

        <div>
          <Button className="w-full sm:w-auto" type="submit">
            {t("sendVerificationCode")}
          </Button>
        </div>
      </form>

      <ChangeEmailVerificationModal
        email={pendingEmail}
        open={Boolean(pendingEmail)}
        onClose={() => setPendingEmail("")}
        onVerified={completeEmailChange}
      />
    </>
  );
}
