import { describe, expect, it } from "vitest";

import {
  getApiError,
  getApiErrorTranslationKey,
  isApiError,
} from "./api-error";

const invalidCredentials = {
  statusCode: 401,
  code: "INVALID_CREDENTIALS",
  message: "Invalid email or password",
};

describe("API errors", () => {
  it("extracts an API error from an RTK Query error", () => {
    const error = { status: 401, data: invalidCredentials };
    expect(getApiError(error)).toEqual(invalidCredentials);
    expect(isApiError(error)).toBe(false);
  });

  it("maps stable API codes to translation keys", () => {
    expect(
      getApiErrorTranslationKey({ status: 401, data: invalidCredentials })
    ).toBe("invalidCredentials");
    expect(
      getApiErrorTranslationKey({
        status: 503,
        data: {
          statusCode: 503,
          code: "NOT_READY",
          message: "A required service is unavailable",
        },
      })
    ).toBe("notReady");
  });

  it("uses safe fallbacks for transport and unknown API errors", () => {
    expect(
      getApiErrorTranslationKey({
        status: 418,
        data: { ...invalidCredentials, code: "NEW_ERROR" },
      })
    ).toBe("unexpected");
    expect(getApiErrorTranslationKey({ status: "FETCH_ERROR" })).toBe(
      "network"
    );
  });
});
