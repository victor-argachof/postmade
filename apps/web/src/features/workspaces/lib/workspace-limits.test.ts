import { describe, expect, it } from "vitest";
import { getWorkspaceChannelLimit } from "./workspace-limits";

describe("getWorkspaceChannelLimit", () => {
  it("uses the trial allowance regardless of the selected plan", () => {
    expect(getWorkspaceChannelLimit("pro", "trialing")).toBe(3);
  });

  it.each([
    ["creator", 15],
    ["growth", 50],
    ["pro", null],
  ] as const)("returns the %s channel allowance", (plan, limit) => {
    expect(getWorkspaceChannelLimit(plan, "active")).toBe(limit);
  });
});
