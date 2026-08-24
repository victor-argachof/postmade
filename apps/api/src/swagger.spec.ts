import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Test } from "@nestjs/testing";

import { MailService } from "./infrastructure/mail.service.js";
import { PrismaService } from "./infrastructure/prisma.service.js";
import { RedisService } from "./infrastructure/redis.service.js";
import { createOpenApiDocument } from "./swagger.js";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.CHANNEL_PROVIDER_MODE ??= "disabled";

describe("OpenAPI contract", () => {
  it("documents every public endpoint", async () => {
    const { AppModule } = await import("./app.module.js");
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(RedisService)
      .useValue({ client: {} })
      .overrideProvider(MailService)
      .useValue({})
      .compile();
    const app = module.createNestApplication();
    app.setGlobalPrefix("api/v1");
    const document = createOpenApiDocument(app);
    for (const path of [
      "/api/v1/auth/register/start",
      "/api/v1/auth/register/verify",
      "/api/v1/auth/login/start",
      "/api/v1/auth/login/verify",
      "/api/v1/auth/code/resend",
      "/api/v1/auth/password/forgot",
      "/api/v1/auth/password/reset",
      "/api/v1/auth/logout",
      "/api/v1/me",
      "/api/v1/account/profile",
      "/api/v1/account/email/change/start",
      "/api/v1/account/email/change/verify",
      "/api/v1/account/email/change/resend",
      "/api/v1/account/password",
      "/api/v1/workspaces",
      "/api/v1/workspaces/{workspaceId}",
      "/api/v1/workspaces/{workspaceId}/tag-groups",
      "/api/v1/workspaces/{workspaceId}/tag-groups/lookup",
      "/api/v1/workspaces/{workspaceId}/tag-groups/{tagGroupId}",
      "/api/v1/workspaces/{workspaceId}/channels",
      "/api/v1/workspaces/{workspaceId}/channels/lookup",
      "/api/v1/workspaces/{workspaceId}/channels/oauth/{platform}/start",
      "/api/v1/workspaces/{workspaceId}/channels/{channelId}",
      "/api/v1/channels/oauth/mock/callback",
      "/api/v1/health/live",
      "/api/v1/health/ready",
    ])
      assert.ok(document.paths[path], `Missing ${path}`);
    assert.ok(document.components?.securitySchemes?.postmade_session);
    await app.close();
  });
});
