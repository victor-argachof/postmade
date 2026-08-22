import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ValidationError } from "class-validator";

import { validationException } from "./validation-error.js";

describe("validationException", () => {
  it("returns language-neutral field details", () => {
    const exception = validationException([
      {
        property: "email",
        constraints: { isEmail: "email must be an email" },
        children: [],
      } as ValidationError,
    ]);

    assert.deepEqual(exception.getResponse(), {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [{ field: "email", code: "INVALID_EMAIL" }],
    });
  });

  it("preserves nested field paths", () => {
    const exception = validationException([
      {
        property: "profile",
        children: [
          {
            property: "name",
            constraints: { minLength: "name is too short" },
            children: [],
          },
        ],
      } as ValidationError,
    ]);

    const response = exception.getResponse() as { details: unknown[] };
    assert.deepEqual(response.details, [
      { field: "profile.name", code: "TOO_SHORT" },
    ]);
  });
});
