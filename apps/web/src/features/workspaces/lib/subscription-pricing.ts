import type { WorkspaceSubscriptionConfiguration } from "../types";

export type SubscriptionCurrency = "USD" | "BRL";

export const SUBSCRIPTION_INCLUDED_QUANTITIES: WorkspaceSubscriptionConfiguration = {
  channels: 3,
  members: 1,
};

export const SUBSCRIPTION_MAX_QUANTITIES: WorkspaceSubscriptionConfiguration = {
  channels: 500,
  members: 100,
};

export const SUBSCRIPTION_MONTHLY_PRICES: Record<SubscriptionCurrency, {
  base: number;
  additionalChannel: number;
  additionalMember: number;
}> = {
  USD: { base: 1_900, additionalChannel: 200, additionalMember: 800 },
  BRL: { base: 9_900, additionalChannel: 1_000, additionalMember: 4_000 },
};

export function normalizeSubscriptionQuantity(
  value: number,
  resource: keyof WorkspaceSubscriptionConfiguration,
  minimum = SUBSCRIPTION_INCLUDED_QUANTITIES[resource],
) {
  const finiteValue = Number.isFinite(value) ? Math.round(value) : minimum;
  return Math.min(Math.max(finiteValue, minimum), SUBSCRIPTION_MAX_QUANTITIES[resource]);
}

export function calculateSubscriptionPrice(
  configuration: WorkspaceSubscriptionConfiguration,
  currency: SubscriptionCurrency,
) {
  const prices = SUBSCRIPTION_MONTHLY_PRICES[currency];
  const channels = normalizeSubscriptionQuantity(configuration.channels, "channels");
  const members = normalizeSubscriptionQuantity(configuration.members, "members");
  const additionalChannels = channels - SUBSCRIPTION_INCLUDED_QUANTITIES.channels;
  const additionalMembers = members - SUBSCRIPTION_INCLUDED_QUANTITIES.members;
  const monthly = prices.base
    + additionalChannels * prices.additionalChannel
    + additionalMembers * prices.additionalMember;

  return {
    additionalChannels,
    additionalMembers,
    monthly,
  };
}

export function getMinimumSubscriptionConfiguration(usage: {
  connectedChannels: number;
  occupiedMembers: number;
}): WorkspaceSubscriptionConfiguration {
  return {
    channels: normalizeSubscriptionQuantity(usage.connectedChannels, "channels"),
    members: normalizeSubscriptionQuantity(usage.occupiedMembers, "members"),
  };
}
