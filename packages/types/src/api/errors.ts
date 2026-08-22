export const API_ERROR_CODES = [
  "ACCOUNT_PROVIDER_RESTRICTED",
  "EMAIL_ALREADY_REGISTERED",
  "EMAIL_UNCHANGED",
  "INTERNAL_ERROR",
  "INVALID_CHALLENGE",
  "INVALID_CODE",
  "INVALID_CREDENTIALS",
  "INVALID_TIMEZONE",
  "NOT_READY",
  "ORIGIN_FORBIDDEN",
  "PASSWORD_UNCHANGED",
  "RATE_LIMITED",
  "RESEND_COOLDOWN",
  "TAG_GROUP_NAME_CONFLICT",
  "TAG_GROUP_NOT_FOUND",
  "UNAUTHENTICATED",
  "VALIDATION_ERROR",
  "WORKSPACE_FORBIDDEN",
  "WORKSPACE_NOT_FOUND",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorDetail {
  field: string;
  code: string;
  params?: Record<string, string | number | boolean>;
}

export interface ApiError {
  statusCode: number;
  code: ApiErrorCode | `HTTP_${number}`;
  message: string;
  details?: ApiErrorDetail[];
}
