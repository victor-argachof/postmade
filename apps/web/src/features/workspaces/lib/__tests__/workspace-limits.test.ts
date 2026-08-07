import { describe, expect, it } from "vitest";

import {
  getWorkspaceChannelLimit,
  getWorkspaceMemberLimit,
} from "../workspace-limits";

describe("getWorkspaceChannelLimit", () => {
  it("uses the trial allowance regardless of the configured quantity", () => {
    expect(
      getWorkspaceChannelLimit({ channels: 200, members: 20 }, "trialing")
    ).toBe(3);
  });

  it("returns the configured channel allowance for a paid subscription", () => {
    expect(
      getWorkspaceChannelLimit({ channels: 37, members: 4 }, "active")
    ).toBe(37);
  });

  it("counts the owner within the configured member allowance", () => {
    expect(getWorkspaceMemberLimit({ channels: 3, members: 7 }, "active")).toBe(
      7
    );
    expect(
      getWorkspaceMemberLimit({ channels: 3, members: 7 }, "trialing")
    ).toBe(1);
  });
});
