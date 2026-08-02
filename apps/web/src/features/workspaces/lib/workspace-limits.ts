import type { SubscriptionStatus, WorkspacePlan } from "../types";

export const WORKSPACE_PLAN_LIMITS: Record<WorkspacePlan, number> = {
  creator: 1,
  growth: 5,
  pro: 15,
};

export const WORKSPACE_PLAN_CHANNEL_LIMITS: Record<WorkspacePlan, number | null> = {
  creator: 15,
  growth: 50,
  pro: null,
};

export const WORKSPACE_TRIAL_LIMITS = {
  days: 15,
  posts: 3,
  channels: 3,
  members: 1,
} as const;

export function getWorkspaceMemberLimit(plan: WorkspacePlan, status: SubscriptionStatus) {
  return status === "trialing" ? WORKSPACE_TRIAL_LIMITS.members : WORKSPACE_PLAN_LIMITS[plan];
}

export function getWorkspaceChannelLimit(plan: WorkspacePlan, status: SubscriptionStatus) {
  return status === "trialing" ? WORKSPACE_TRIAL_LIMITS.channels : WORKSPACE_PLAN_CHANNEL_LIMITS[plan];
}
