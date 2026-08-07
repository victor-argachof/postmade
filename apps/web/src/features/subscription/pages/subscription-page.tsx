import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

import { getMinimumSubscriptionConfiguration } from "@/features/workspaces/lib/subscription-pricing";
import { WORKSPACE_TRIAL_LIMITS } from "@/features/workspaces/lib/workspace-limits";
import type { WorkspaceSubscriptionConfiguration } from "@/features/workspaces/types";
import { PageHeader } from "@/shared/components/page-header";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { BillingDetailsCard } from "../components/billing-details-card";
import { SubscriptionConfigurator } from "../components/subscription-configurator";
import { SubscriptionFaq } from "../components/subscription-faq";
import { SubscriptionSummary } from "../components/subscription-summary";
import { TrialDetailsCard } from "../components/trial-details-card";
import {
  useCreateBillingPortalSessionMutation,
  useCreateCheckoutSessionMutation,
  useUpdateSubscriptionMutation,
} from "../services/billing-api";

export function SubscriptionPage() {
  const { t } = useTranslation("subscription");
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const [createBillingPortalSession, { isLoading: isOpeningPortal }] =
    useCreateBillingPortalSessionMutation();
  const [createCheckoutSession] = useCreateCheckoutSessionMutation();
  const [updateSubscription, { isLoading: isUpdatingSubscription }] =
    useUpdateSubscriptionMutation();

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
    ? Math.max(
        0,
        Math.ceil(
          (new Date(workspace.trialEndsAt).getTime() - Date.now()) / 86_400_000
        )
      )
    : 15;
  const canManageBilling = Boolean(
    workspace && user && workspace.ownerId === user.id
  );
  const openBillingPortal = async () => {
    if (!workspace || !canManageBilling) return;
    const portalWindow = window.open("about:blank", "_blank");
    if (portalWindow) portalWindow.opener = null;

    try {
      const { url } = await createBillingPortalSession({
        workspaceId: workspace.id,
      }).unwrap();
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
  const startCheckout = async (
    configuration: WorkspaceSubscriptionConfiguration
  ) => {
    if (!workspace || !canManageBilling) return;

    try {
      const { url } = await createCheckoutSession({
        workspaceId: workspace.id,
        channelQuantity: configuration.channels,
        memberQuantity: configuration.members,
      }).unwrap();
      window.location.assign(url);
    } catch {
      toast.error(t("checkoutError"));
    }
  };
  const subscribe = (configuration: WorkspaceSubscriptionConfiguration) => {
    if (!workspace || !user || workspace.ownerId !== user.id) return;
    if (
      workspace.subscriptionStatus === "trialing" ||
      workspace.subscriptionStatus === "canceled" ||
      workspace.subscriptionStatus === "expired"
    ) {
      void startCheckout(configuration);
    }
  };

  const connectedChannels =
    workspace?.resources.channels.filter((channel) => channel.connected)
      .length ?? 0;
  const occupiedMembers = workspace
    ? workspace.members.length +
      workspace.invitations.filter(
        (invitation) => invitation.status === "pending"
      ).length
    : 1;
  const minimumConfiguration = getMinimumSubscriptionConfiguration({
    connectedChannels,
    occupiedMembers,
  });
  const configuredQuantities = workspace
    ? {
        channels: Math.max(
          workspace.subscriptionConfiguration.channels,
          minimumConfiguration.channels
        ),
        members: Math.max(
          workspace.subscriptionConfiguration.members,
          minimumConfiguration.members
        ),
      }
    : minimumConfiguration;
  const requestSubscriptionUpdate = async (
    configuration: WorkspaceSubscriptionConfiguration
  ) => {
    if (
      !workspace ||
      !canManageBilling ||
      workspace.subscriptionStatus !== "active"
    )
      return false;
    if (
      configuration.channels < minimumConfiguration.channels ||
      configuration.members < minimumConfiguration.members
    ) {
      toast.error(t("subscriptionUsageValidationError"));
      return false;
    }

    try {
      await updateSubscription({
        workspaceId: workspace.id,
        channelQuantity: configuration.channels,
        memberQuantity: configuration.members,
      }).unwrap();
      toast.success(t("subscriptionUpdateRequested"));
      return true;
    } catch {
      toast.error(t("subscriptionUpdateError"));
      return false;
    }
  };

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
        membersUsed={occupiedMembers}
        onSubscribe={scrollToConfigurator}
      />
      {!canManageBilling && workspace && (
        <p className="mt-8 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          {t("ownerOnly")}
        </p>
      )}
      <SubscriptionConfigurator
        configuration={configuredQuantities}
        minimumConfiguration={minimumConfiguration}
        status={workspace?.subscriptionStatus}
        onManage={canManageBilling ? openBillingPortal : undefined}
        onSubscribe={!workspace || canManageBilling ? subscribe : undefined}
        onUpdate={canManageBilling ? requestSubscriptionUpdate : undefined}
        isUpdating={isUpdatingSubscription}
        usage={{
          connectedChannels,
          members: workspace?.members.length ?? 1,
          pendingInvitations:
            workspace?.invitations.filter(
              (invitation) => invitation.status === "pending"
            ).length ?? 0,
        }}
      />
      <SubscriptionFaq />
    </section>
  );
}
