export const API_ERROR_CODES = [
  "EMAIL_ALREADY_REGISTERED",
  "INTERNAL_ERROR",
  "INVALID_CHALLENGE",
  "INVALID_CODE",
  "INVALID_CREDENTIALS",
  "INVALID_TIMEZONE",
  "NOT_READY",
  "ORIGIN_FORBIDDEN",
  "RATE_LIMITED",
  "RESEND_COOLDOWN",
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
