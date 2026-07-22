import { useTranslation } from "react-i18next";
import { SubscriptionSummary } from "../components/subscription-summary";
import { PricingPlans } from "../components/pricing-plans";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";
import { setWorkspacePlan, type WorkspacePlan } from "@/features/workspaces/store/workspaces-slice";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/page-header";

export function SubscriptionPage() {
  const { t } = useTranslation("subscription");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.workspaces.items.find(
    (item) => item.id === state.workspaces.activeWorkspaceId,
  ));

  const scrollToPlans = () => {
    document.getElementById("pricing-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const selectPlan = (plan: WorkspacePlan) => {
    if (!workspace || !user || workspace.ownerId !== user.id) return;
    dispatch(setWorkspacePlan({ workspaceId: workspace.id, plan, actorId: user.id }));
    toast.success(t("planUpdated", { plan: t(`plans.${plan}.name`) }));
  };

  const remainingDays = workspace
    ? Math.max(0, Math.ceil((new Date(workspace.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 15;
  const canManageBilling = Boolean(workspace && user && workspace.ownerId === user.id);

  return (
    <section className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("pageTitle")}
        description={t("pageDescription", { workspace: workspace?.name ?? "" })}
      />
      <SubscriptionSummary
        plan={workspace?.plan}
        trialing={workspace ? workspace.subscriptionStatus === "trialing" : true}
        remainingDays={remainingDays}
        onSubscribe={scrollToPlans}
      />
      {!canManageBilling && workspace && <p className="mt-8 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">{t("ownerOnly")}</p>}
      <PricingPlans
        currentPlan={workspace?.subscriptionStatus === "active" ? workspace.plan : undefined}
        onSelectPlan={!workspace || canManageBilling ? selectPlan : undefined}
      />
    </section>
  );
}
