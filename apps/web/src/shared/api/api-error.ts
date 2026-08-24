import type { ApiError, ApiErrorCode } from "@postmade/types";

export type ApiErrorTranslationKey =
  | "accountProviderRestricted"
  | "channelAlreadyConnected"
  | "channelLimitReached"
  | "channelNotFound"
  | "channelProviderUnavailable"
  | "channelReauthRequired"
  | "emailAlreadyRegistered"
  | "emailUnchanged"
  | "forbidden"
  | "internal"
  | "invalidChallenge"
  | "invalidCode"
  | "invalidCredentials"
  | "invalidOAuthState"
  | "invalidTimezone"
  | "invitationAlreadyAccepted"
  | "invitationDuplicate"
  | "invitationEmailFailed"
  | "invitationEmailMismatch"
  | "invitationExpired"
  | "invitationInvalid"
  | "invitationRevoked"
  | "network"
  | "notFound"
  | "notReady"
  | "passwordUnchanged"
  | "rateLimited"
  | "resendCooldown"
  | "tagGroupNameConflict"
  | "tagGroupNotFound"
  | "unauthenticated"
  | "unexpected"
  | "validation"
  | "workspaceMemberExists"
  | "workspaceMemberLimitReached"
  | "workspaceMemberNotFound";

export const API_ERROR_TRANSLATION_KEYS = {
  ACCOUNT_PROVIDER_RESTRICTED: "accountProviderRestricted",
  CHANNEL_ALREADY_CONNECTED: "channelAlreadyConnected",
  CHANNEL_LIMIT_REACHED: "channelLimitReached",
  CHANNEL_NOT_FOUND: "channelNotFound",
  CHANNEL_PROVIDER_UNAVAILABLE: "channelProviderUnavailable",
  CHANNEL_REAUTH_REQUIRED: "channelReauthRequired",
  EMAIL_ALREADY_REGISTERED: "emailAlreadyRegistered",
  EMAIL_UNCHANGED: "emailUnchanged",
  INTERNAL_ERROR: "internal",
  INVALID_CHALLENGE: "invalidChallenge",
  INVALID_CODE: "invalidCode",
  INVALID_CREDENTIALS: "invalidCredentials",
  INVALID_OAUTH_STATE: "invalidOAuthState",
  INVALID_TIMEZONE: "invalidTimezone",
  INVITATION_ALREADY_ACCEPTED: "invitationAlreadyAccepted",
  INVITATION_DUPLICATE: "invitationDuplicate",
  INVITATION_EMAIL_FAILED: "invitationEmailFailed",
  INVITATION_EMAIL_MISMATCH: "invitationEmailMismatch",
  INVITATION_EXPIRED: "invitationExpired",
  INVITATION_INVALID: "invitationInvalid",
  INVITATION_REVOKED: "invitationRevoked",
  NOT_READY: "notReady",
  ORIGIN_FORBIDDEN: "forbidden",
  PASSWORD_UNCHANGED: "passwordUnchanged",
  RATE_LIMITED: "rateLimited",
  RESEND_COOLDOWN: "resendCooldown",
  TAG_GROUP_NAME_CONFLICT: "tagGroupNameConflict",
  TAG_GROUP_NOT_FOUND: "tagGroupNotFound",
  WORKSPACE_MEMBER_EXISTS: "workspaceMemberExists",
  WORKSPACE_MEMBER_LIMIT_REACHED: "workspaceMemberLimitReached",
  WORKSPACE_MEMBER_NOT_FOUND: "workspaceMemberNotFound",
  UNAUTHENTICATED: "unauthenticated",
  VALIDATION_ERROR: "validation",
  WORKSPACE_FORBIDDEN: "forbidden",
  WORKSPACE_NOT_FOUND: "notFound",
} as const satisfies Record<ApiErrorCode, ApiErrorTranslationKey>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.statusCode === "number" &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

export function getApiError(error: unknown): ApiError | undefined {
  if (isApiError(error)) return error;
  if (isRecord(error) && isApiError(error.data)) return error.data;
  return undefined;
}

export function getApiErrorTranslationKey(
  error: unknown
): ApiErrorTranslationKey {
  const apiError = getApiError(error);
  if (apiError) {
    return (
      API_ERROR_TRANSLATION_KEYS[
        apiError.code as keyof typeof API_ERROR_TRANSLATION_KEYS
      ] ?? "unexpected"
    );
  }
  if (isRecord(error) && "status" in error) return "network";
  return "unexpected";
}
