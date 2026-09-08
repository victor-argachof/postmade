import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateConfig } from "./config.js";

const required = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  R2_ACCOUNT_ID: "account",
  R2_BUCKET: "bucket",
  R2_ACCESS_KEY_ID: "access",
  R2_SECRET_ACCESS_KEY: "secret",
};

describe("channel provider configuration", () => {
  it("requires the four R2 runtime credentials", () => {
    assert.throws(() =>
      validateConfig({ ...required, R2_SECRET_ACCESS_KEY: undefined })
    );
  });
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
