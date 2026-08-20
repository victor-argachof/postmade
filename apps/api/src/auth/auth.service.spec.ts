import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthService } from "./auth.service.js";

describe("AuthService", () => {
  it("normalizes email addresses consistently", () => {
    const service = new AuthService({} as never, {} as never, {} as never);
    assert.equal(
      service.normalizeEmail("  Victor@Example.COM "),
      "victor@example.com"
    );
  });
  it("never exposes credential fields in the public user shape", () => {
    const service = new AuthService({} as never, {} as never, {} as never);
    const user = service.toSafeUser({
      id: "user-1",
      name: "Victor",
      email: "victor@example.com",
      createdAt: new Date("2026-08-20T00:00:00Z"),
      updatedAt: new Date(),
    });
    assert.deepEqual(Object.keys(user).sort(), [
      "createdAt",
      "email",
      "id",
      "identity",
      "name",
    ]);
    assert.equal("passwordHash" in user, false);
    assert.equal("token" in user, false);
  });
});
