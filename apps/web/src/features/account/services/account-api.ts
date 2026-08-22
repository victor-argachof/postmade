import type {
  ChallengeResponse,
  ChangePasswordInput,
  PublicUser,
  ResendEmailChangeInput,
  StartEmailChangeInput,
  UpdateProfileInput,
  VerifyEmailChangeInput,
} from "@postmade/types";

import { api } from "@/shared/api/api";

import type {
  AccountDeletionImpact,
  DeleteAccountRequest,
} from "../types/deletion";

export const accountApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateProfile: build.mutation<PublicUser, UpdateProfileInput>({
      query: (body) => ({ url: "/account/profile", method: "PATCH", body }),
    }),
    startEmailChange: build.mutation<ChallengeResponse, StartEmailChangeInput>({
      query: (body) => ({
        url: "/account/email/change/start",
        method: "POST",
        body,
      }),
    }),
    verifyEmailChange: build.mutation<PublicUser, VerifyEmailChangeInput>({
      query: (body) => ({
        url: "/account/email/change/verify",
        method: "POST",
        body,
      }),
    }),
    resendEmailChange: build.mutation<
      ChallengeResponse,
      ResendEmailChangeInput
    >({
      query: (body) => ({
        url: "/account/email/change/resend",
        method: "POST",
        body,
      }),
    }),
    changePassword: build.mutation<void, ChangePasswordInput>({
      query: (body) => ({ url: "/account/password", method: "PATCH", body }),
    }),
    getAccountDeletionImpact: build.query<AccountDeletionImpact, void>({
      query: () => "/account/deletion-impact",
    }),
    deleteAccount: build.mutation<void, DeleteAccountRequest>({
      query: (body) => ({
        url: "/account",
        method: "DELETE",
        body,
      }),
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useStartEmailChangeMutation,
  useVerifyEmailChangeMutation,
  useResendEmailChangeMutation,
  useChangePasswordMutation,
  useLazyGetAccountDeletionImpactQuery,
  useDeleteAccountMutation,
} = accountApi;
