import { describe, expect, it } from "vitest";
import {
  calculateSubscriptionPrice,
  getMinimumSubscriptionConfiguration,
  normalizeSubscriptionQuantity,
} from "../subscription-pricing";

describe("subscription pricing", () => {
  it("calculates the included monthly configuration in both currencies", () => {
    expect(calculateSubscriptionPrice({ channels: 3, members: 1 }, "USD")).toEqual({
      additionalChannels: 0,
      additionalMembers: 0,
      monthly: 1_900,
    });
    expect(calculateSubscriptionPrice({ channels: 3, members: 1 }, "BRL").monthly).toBe(9_900);
  });

  it("adds channels and members to the monthly price", () => {
    expect(calculateSubscriptionPrice({ channels: 5, members: 3 }, "USD")).toEqual({
      additionalChannels: 2,
      additionalMembers: 2,
      monthly: 3_900,
    });
  });

  it("normalizes quantities and prevents configuration below current usage", () => {
    expect(normalizeSubscriptionQuantity(1, "channels")).toBe(3);
    expect(normalizeSubscriptionQuantity(999, "channels")).toBe(500);
    expect(normalizeSubscriptionQuantity(999, "members")).toBe(100);
    expect(getMinimumSubscriptionConfiguration({ connectedChannels: 12, occupiedMembers: 4 })).toEqual({ channels: 12, members: 4 });
  });
});
