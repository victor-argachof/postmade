import type { TFunction } from "i18next";
import { z } from "zod";

export type ProfileFormValues = {
  name: string;
};

export function createProfileSchema(t: TFunction<"account">) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.fullNameRequired"))
      .refine(
        (name) => name.split(/\s+/).length >= 2,
        t("validation.fullNameIncomplete")
      ),
  });
}
