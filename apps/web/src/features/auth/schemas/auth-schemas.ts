import type { TFunction } from "i18next";
import { z } from "zod";

export type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

export type ForgotPasswordFormValues = {
  email: string;
};

export type VerificationCodeFormValues = {
  code: string;
};

export type ResetPasswordFormValues = VerificationCodeFormValues & {
  password: string;
};

const emailSchema = (t: TFunction<"auth">) =>
  z
    .string()
    .trim()
    .min(1, t("validation.emailRequired"))
    .email(t("validation.emailInvalid"));

const strongPasswordSchema = (t: TFunction<"auth">) =>
  z
    .string()
    .min(1, t("validation.passwordRequired"))
    .min(8, t("validation.passwordMinLength"))
    .regex(/[A-Z]/, t("validation.passwordUppercase"))
    .regex(/[a-z]/, t("validation.passwordLowercase"))
    .regex(/\d/, t("validation.passwordNumber"))
    .regex(/[^A-Za-z0-9]/, t("validation.passwordSpecialCharacter"));

export function createAuthSchema(t: TFunction<"auth">, isRegister: boolean) {
  const passwordSchema = isRegister
    ? strongPasswordSchema(t)
    : z.string().min(1, t("validation.passwordRequired"));

  return z
    .object({
      name: z.string().trim().optional(),
      email: emailSchema(t),
      password: passwordSchema,
    })
    .superRefine((values, context) => {
      if (!isRegister) return;

      if (!values.name) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.fullNameRequired"),
          path: ["name"],
        });
      } else if (values.name.split(/\s+/).length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.fullNameIncomplete"),
          path: ["name"],
        });
      }
    });
}

export function createForgotPasswordSchema(t: TFunction<"auth">) {
  return z.object({ email: emailSchema(t) });
}

export function createVerificationCodeSchema(t: TFunction<"auth">) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, t("validation.verificationCodeRequired"))
      .regex(/^\d{6}$/, t("validation.verificationCodeFormat")),
  });
}

export function createResetPasswordSchema(t: TFunction<"auth">) {
  return createVerificationCodeSchema(t).extend({
    password: strongPasswordSchema(t),
  });
}
