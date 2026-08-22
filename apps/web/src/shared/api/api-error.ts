import type { ApiError, ApiErrorCode } from "@postmade/types";

export type ApiErrorTranslationKey =
  | "emailAlreadyRegistered"
  | "forbidden"
  | "internal"
  | "invalidChallenge"
  | "invalidCode"
  | "invalidCredentials"
  | "invalidTimezone"
  | "network"
  | "notFound"
  | "notReady"
  | "rateLimited"
  | "resendCooldown"
  | "unauthenticated"
  | "unexpected"
  | "validation";

export const API_ERROR_TRANSLATION_KEYS = {
  EMAIL_ALREADY_REGISTERED: "emailAlreadyRegistered",
  INTERNAL_ERROR: "internal",
  INVALID_CHALLENGE: "invalidChallenge",
  INVALID_CODE: "invalidCode",
  INVALID_CREDENTIALS: "invalidCredentials",
  INVALID_TIMEZONE: "invalidTimezone",
  NOT_READY: "notReady",
  ORIGIN_FORBIDDEN: "forbidden",
  RATE_LIMITED: "rateLimited",
  RESEND_COOLDOWN: "resendCooldown",
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
