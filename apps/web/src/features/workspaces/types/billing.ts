export type WorkspacePlan = "creator" | "growth" | "pro";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type BillingCycle = "monthly" | "annual";

export interface WorkspaceBilling {
  cycle: BillingCycle | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  currency: string | null;
  nextInvoiceAmount: number | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}
