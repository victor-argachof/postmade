import { api } from "@/shared/api/api";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  identity: { provider: "password"; emailVerified: boolean };
  createdAt: string;
}
export interface ChallengeResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}
export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    me: build.query<ApiUser, void>({ query: () => "/me" }),
    registerStart: build.mutation<
      ChallengeResponse,
      { name: string; email: string; password: string; timezone?: string }
    >({
      query: (body) => ({ url: "/auth/register/start", method: "POST", body }),
    }),
    registerVerify: build.mutation<
      ApiUser,
      { challengeId: string; code: string }
    >({
      query: (body) => ({ url: "/auth/register/verify", method: "POST", body }),
    }),
    loginStart: build.mutation<
      ChallengeResponse,
      { email: string; password: string }
    >({
      query: (body) => ({ url: "/auth/login/start", method: "POST", body }),
    }),
    loginVerify: build.mutation<ApiUser, { challengeId: string; code: string }>(
      { query: (body) => ({ url: "/auth/login/verify", method: "POST", body }) }
    ),
    resendCode: build.mutation<ChallengeResponse, { challengeId: string }>({
      query: (body) => ({ url: "/auth/code/resend", method: "POST", body }),
    }),
    forgotPassword: build.mutation<ChallengeResponse, { email: string }>({
      query: (body) => ({ url: "/auth/password/forgot", method: "POST", body }),
    }),
    resetPassword: build.mutation<
      void,
      { challengeId: string; code: string; password: string }
    >({
      query: (body) => ({ url: "/auth/password/reset", method: "POST", body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});
export const {
  useMeQuery,
  useRegisterStartMutation,
  useRegisterVerifyMutation,
  useLoginStartMutation,
  useLoginVerifyMutation,
  useResendCodeMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
