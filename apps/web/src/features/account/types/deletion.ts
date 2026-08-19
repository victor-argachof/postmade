import type { SubscriptionStatus } from "@/features/workspaces/types";

export type AccountDeletionReason =
  | "price"
  | "not_using"
  | "difficult_to_use"
  | "missing_features"
  | "technical_issues"
  | "privacy"
  | "moving_service"
  | "other";

export interface AccountDeletionImpact {
  ownedWorkspaces: Array<{
    id: string;
    name: string;
    memberCount: number;
    subscriptionStatus: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodEndsAt: string | null;
  }>;
  externalWorkspaces: Array<{ id: string; name: string }>;
  blocked: boolean;
  availableAt: string | null;
}

export interface DeleteAccountRequest {
  reason: AccountDeletionReason;
  comment?: string;
  reauthentication:
    | { provider: "password"; password: string }
    | { provider: "google"; credential: string };
  idempotencyKey: string;
}
