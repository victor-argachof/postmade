import type { TFunction } from "i18next";
import { z } from "zod";

export type ChangeEmailFormValues = {
  newEmail: string;
};

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
};

export function createChangeEmailSchema(
  t: TFunction<"account">,
  currentEmail: string
) {
  return z.object({
    newEmail: z
      .string()
      .trim()
      .min(1, t("validation.newEmailRequired"))
      .email(t("validation.emailInvalid"))
      .refine(
        (email) => email.toLowerCase() !== currentEmail.toLowerCase(),
        t("validation.emailMustChange")
      ),
  });
}

export function createChangePasswordSchema(t: TFunction<"account">) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t("validation.currentPasswordRequired")),
      newPassword: z
        .string()
        .min(1, t("validation.newPasswordRequired"))
        .min(8, t("validation.passwordMinLength"))
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[a-z]/, t("validation.passwordLowercase"))
        .regex(/\d/, t("validation.passwordNumber"))
        .regex(/[^A-Za-z0-9]/, t("validation.passwordSpecialCharacter")),
    })
    .refine((values) => values.currentPassword !== values.newPassword, {
      message: t("validation.passwordMustChange"),
      path: ["newPassword"],
    });
}
