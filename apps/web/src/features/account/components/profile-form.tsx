import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { syncAccountUser } from "../lib/sync-account-user";
import {
  createProfileSchema,
  type ProfileFormValues,
} from "../schemas/profile-schema";
import { useUpdateProfileMutation } from "../services/account-api";

export function ProfileForm() {
  const { t } = useTranslation("account");
  const { t: tApiError } = useTranslation("apiErrors");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const schema = useMemo(() => createProfileSchema(t), [t]);
  const fallbackName = user?.name ?? t("fallbackName");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: fallbackName },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset({ name: fallbackName });
  }, [fallbackName, reset]);

  const saveProfile = async (values: ProfileFormValues) => {
    try {
      const updatedUser = await updateProfile(values).unwrap();
      syncAccountUser(dispatch, updatedUser);
      reset({ name: updatedUser.name });
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.error(tApiError(getApiErrorTranslationKey(error)));
    }
  };

  return (
    <form
      className="mt-8 space-y-5"
      noValidate
      onSubmit={handleSubmit(saveProfile)}
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="account-name">
          {t("fullName")}
        </label>
        <Input
          aria-describedby={errors.name ? "account-name-error" : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          className={`mt-2 ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
          id="account-name"
          {...register("name")}
        />
        {errors.name && (
          <p
            className="mt-2 text-xs text-red-600"
            id="account-name-error"
            role="alert"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Button
          className="w-full sm:w-auto"
          disabled={!isDirty || isSubmitting || isLoading}
          type="submit"
        >
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
