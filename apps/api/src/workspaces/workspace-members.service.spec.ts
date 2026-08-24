import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenException } from "@nestjs/common";

import { WorkspaceMembersService } from "./workspace-members.service.js";

function service(input?: {
  invitation?: Record<string, unknown>;
  actorRole?: string;
}) {
  const invitation = input?.invitation;
  return new WorkspaceMembersService(
    {
      workspaceInvitation: {
        findUnique: async () => invitation ?? null,
      },
    } as never,
    {
      requireMembership: async () => ({ role: input?.actorRole ?? "owner" }),
    } as never,
    { sendWorkspaceInvitation: async () => undefined } as never,
    { getOrThrow: () => "http://localhost:5173" } as never
  );
}

describe("WorkspaceMembersService", () => {
  it("reports an elapsed pending invitation as expired", async () => {
    const result = await service({
      invitation: {
        workspace: { name: "Studio" },
        sender: { name: "Ada" },
        email: "member@example.com",
        role: "editor",
        status: "pending",
        expiresAt: new Date(Date.now() - 1_000),
      },
    }).details("token");
    assert.equal(result.status, "expired");
  });

  it("prevents admins from managing admin invitations", async () => {
    const members = service({ actorRole: "admin" });
    await assert.rejects(
      members.create("actor", "workspace", "member@example.com", "admin"),
      ForbiddenException
    );
  });
});
