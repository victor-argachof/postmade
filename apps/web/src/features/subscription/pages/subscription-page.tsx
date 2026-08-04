import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SubscriptionSummary } from "../components/subscription-summary";
import { SubscriptionConfigurator } from "../components/subscription-configurator";
import { useAppSelector } from "@/shared/hooks/store-hooks";
import type { BillingCycle, WorkspaceSubscriptionConfiguration } from "@/features/workspaces/types";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/page-header";
import { BillingDetailsCard } from "../components/billing-details-card";
import {
  useCreateBillingPortalSessionMutation,
  useCreateCheckoutSessionMutation,
} from "../services/billing-api";
import { TrialDetailsCard } from "../components/trial-details-card";
import { WORKSPACE_TRIAL_LIMITS } from "@/features/workspaces/lib/workspace-limits";
import { getMinimumSubscriptionConfiguration } from "@/features/workspaces/lib/subscription-pricing";
import { SubscriptionFaq } from "../components/subscription-faq";

export function SubscriptionPage() {
  const { t } = useTranslation("subscription");
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.workspaces.items.find(
    (item) => item.id === state.workspaces.activeWorkspaceId,
  ));
  const [createBillingPortalSession, { isLoading: isOpeningPortal }] = useCreateBillingPortalSessionMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();

  useEffect(() => {
    if (location.hash !== "#subscription-configurator") return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("subscription-configurator")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  const scrollToConfigurator = () => {
    document.getElementById("subscription-configurator")?.scrollIntoView({
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
  const startCheckout = async (configuration: WorkspaceSubscriptionConfiguration, billingCycle: BillingCycle) => {
    if (!workspace || !canManageBilling) return;

    try {
      const { url } = await createCheckoutSession({
        workspaceId: workspace.id,
        billingCycle,
        channelQuantity: configuration.channels,
        memberQuantity: configuration.members,
      }).unwrap();
      window.location.assign(url);
    } catch {
      toast.error(t("checkoutError"));
    }
  };
  const subscribe = (configuration: WorkspaceSubscriptionConfiguration, billingCycle: BillingCycle) => {
    if (!workspace || !user || workspace.ownerId !== user.id) return;
    if (
      workspace.subscriptionStatus === "trialing"
      || workspace.subscriptionStatus === "canceled"
      || workspace.subscriptionStatus === "expired"
    ) {
      void startCheckout(configuration, billingCycle);
    }
  };

  const connectedChannels = workspace?.resources.channels.filter((channel) => channel.connected).length ?? 0;
  const occupiedMembers = workspace
    ? workspace.members.length + workspace.invitations.filter((invitation) => invitation.status === "pending").length
    : 1;
  const minimumConfiguration = getMinimumSubscriptionConfiguration({ connectedChannels, occupiedMembers });
  const configuredQuantities = workspace ? {
    channels: Math.max(workspace.subscriptionConfiguration.channels, minimumConfiguration.channels),
    members: Math.max(workspace.subscriptionConfiguration.members, minimumConfiguration.members),
  } : minimumConfiguration;

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription", { workspace: workspace?.name ?? "" })}
      />
      {workspace && workspace.subscriptionStatus !== "trialing" && (
        <BillingDetailsCard
          configuration={workspace.subscriptionConfiguration}
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
        configuration={workspace?.subscriptionConfiguration}
        status={workspace?.subscriptionStatus}
        postsUsed={workspace?.resources.posts.length}
        channelsConnected={connectedChannels}
        membersUsed={workspace?.members.length}
        onSubscribe={scrollToConfigurator}
      />
      {!canManageBilling && workspace && <p className="mt-8 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">{t("ownerOnly")}</p>}
      <SubscriptionConfigurator
        configuration={configuredQuantities}
        currentBillingCycle={workspace?.billing?.cycle}
        minimumConfiguration={minimumConfiguration}
        status={workspace?.subscriptionStatus}
        onManage={canManageBilling ? openBillingPortal : undefined}
        onSubscribe={!workspace || canManageBilling ? subscribe : undefined}
      />
      <SubscriptionFaq />
    </section>
  );
}
