import type { ApiErrorCode, ApiErrorDetail } from "@postmade/types";

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[]
) {
  return { code, message, ...(details ? { details } : {}) };
}
