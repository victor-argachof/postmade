import type {
  SubscriptionStatus,
  WorkspaceSubscriptionConfiguration,
} from "../types";

export const WORKSPACE_TRIAL_LIMITS = {
  days: 15,
  posts: 3,
  channels: 3,
  members: 1,
} as const;

export function getWorkspaceMemberLimit(
  configuration: WorkspaceSubscriptionConfiguration,
  status: SubscriptionStatus
) {
  return status === "trialing"
    ? WORKSPACE_TRIAL_LIMITS.members
    : configuration.members;
}

export function getWorkspaceChannelLimit(
  configuration: WorkspaceSubscriptionConfiguration,
  status: SubscriptionStatus
) {
  return status === "trialing"
    ? WORKSPACE_TRIAL_LIMITS.channels
    : configuration.channels;
}
