import { useTranslation } from "react-i18next";
import { SubscriptionSummary } from "../components/subscription-summary";
import { PricingPlans } from "../components/pricing-plans";
import { useAppSelector } from "@/shared/hooks/store-hooks";
import {
  type BillingCycle,
  type WorkspacePlan,
} from "@/features/workspaces/types";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/page-header";
import { BillingDetailsCard } from "../components/billing-details-card";
import {
  useCreateBillingPortalSessionMutation,
  useCreateCheckoutSessionMutation,
} from "../services/billing-api";
import { TrialDetailsCard } from "../components/trial-details-card";
import { WORKSPACE_TRIAL_LIMITS } from "@/features/workspaces/lib/workspace-limits";

export function SubscriptionPage() {
  const { t } = useTranslation("subscription");
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.workspaces.items.find(
    (item) => item.id === state.workspaces.activeWorkspaceId,
  ));
  const [createBillingPortalSession, { isLoading: isOpeningPortal }] = useCreateBillingPortalSessionMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  const scrollToPlans = () => {
    document.getElementById("pricing-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const remainingDays = workspace
    ? Math.max(0, Math.ceil((new Date(workspace.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 15;
  const canManageBilling = Boolean(workspace && user && workspace.ownerId === user.id);
  const openBillingPortal = async () => {
    if (!workspace || !canManageBilling) return;
    const portalWindow = window.open("about:blank", "_blank");
    if (portalWindow) portalWindow.opener = null;

    try {
      const { url } = await createBillingPortalSession({ workspaceId: workspace.id }).unwrap();
      if (portalWindow) {
        portalWindow.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      portalWindow?.close();
      toast.error(t("billingPortalError"));
    }
  };
  const startCheckout = async (plan: WorkspacePlan, billingCycle: BillingCycle) => {
    if (!workspace || !canManageBilling) return;

    try {
      const { url } = await createCheckoutSession({
        workspaceId: workspace.id,
        plan,
        billingCycle,
      }).unwrap();
      window.location.assign(url);
    } catch {
      toast.error(t("checkoutError"));
    }
  };
  const selectPlan = (plan: WorkspacePlan, billingCycle: BillingCycle) => {
    if (!workspace || !user || workspace.ownerId !== user.id) return;
    if (
      workspace.subscriptionStatus === "trialing"
      || workspace.subscriptionStatus === "canceled"
      || workspace.subscriptionStatus === "expired"
    ) {
      void startCheckout(plan, billingCycle);
      return;
    }
    void openBillingPortal();
  };

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription", { workspace: workspace?.name ?? "" })}
      />
      {workspace && workspace.subscriptionStatus !== "trialing" && (
        <BillingDetailsCard
          plan={workspace.plan}
          status={workspace.subscriptionStatus}
          currentPeriodEndsAt={workspace.billing?.currentPeriodEndsAt}
          cancelAtPeriodEnd={workspace.billing?.cancelAtPeriodEnd}
          currency={workspace.billing?.currency}
          nextInvoiceAmount={workspace.billing?.nextInvoiceAmount}
          paymentMethodBrand={workspace.billing?.paymentMethodBrand}
          paymentMethodLast4={workspace.billing?.paymentMethodLast4}
          canManage={canManageBilling}
          isOpeningPortal={isOpeningPortal}
          onManage={openBillingPortal}
        />
      )}
      {(!workspace || workspace.subscriptionStatus === "trialing") && (
        <TrialDetailsCard
          remainingDays={remainingDays}
          totalDays={WORKSPACE_TRIAL_LIMITS.days}
          trialEndsAt={workspace?.trialEndsAt}
        />
      )}
      <SubscriptionSummary
        plan={workspace?.plan}
        status={workspace?.subscriptionStatus}
        postsUsed={workspace?.resources.posts.length}
        channelsConnected={workspace?.resources.channels.length}
        membersUsed={workspace?.members.length}
        onSubscribe={scrollToPlans}
        onUpgrade={canManageBilling ? scrollToPlans : undefined}
      />
      {!canManageBilling && workspace && <p className="mt-8 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">{t("ownerOnly")}</p>}
      <PricingPlans
        currentPlan={workspace?.plan}
        currentBillingCycle={workspace?.billing?.cycle}
        status={workspace?.subscriptionStatus}
        onSelectPlan={!workspace || canManageBilling ? selectPlan : undefined}
      />
    </section>
  );
}
