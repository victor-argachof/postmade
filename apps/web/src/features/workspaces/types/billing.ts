export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export interface WorkspaceSubscriptionConfiguration {
  channels: number;
  members: number;
}

export interface WorkspaceBilling {
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  currency: string | null;
  nextInvoiceAmount: number | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}
