import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

import { WorkspaceAccessService } from "./workspace-access.service.js";

describe("WorkspaceAccessService", () => {
  it("hides workspaces unavailable to the user", async () => {
    const prisma = { workspaceMember: { findUnique: async () => null } };
    const service = new WorkspaceAccessService(prisma as never);
    await assert.rejects(
      service.requireMembership("user", "workspace"),
      NotFoundException
    );
  });

  it("rejects a viewer when a managing role is required", async () => {
    const prisma = {
      workspaceMember: {
        findUnique: async () => ({ role: "viewer", workspace: {} }),
      },
    };
    const service = new WorkspaceAccessService(prisma as never);
    await assert.rejects(
      service.requireRole("user", "workspace", ["owner", "admin", "editor"]),
      ForbiddenException
    );
  });
});
