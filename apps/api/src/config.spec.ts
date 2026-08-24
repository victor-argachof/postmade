import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateConfig } from "./config.js";

const required = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
};

describe("channel provider configuration", () => {
  it("allows the mock provider in development", () => {
    assert.equal(
      validateConfig({
        ...required,
        NODE_ENV: "development",
        CHANNEL_PROVIDER_MODE: "mock",
      }).CHANNEL_PROVIDER_MODE,
      "mock"
    );
  });

  it("rejects the mock provider in production", () => {
    assert.throws(() =>
      validateConfig({
        ...required,
        NODE_ENV: "production",
        CHANNEL_PROVIDER_MODE: "mock",
      })
    );
  });
});
