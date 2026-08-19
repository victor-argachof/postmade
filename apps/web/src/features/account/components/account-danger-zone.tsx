import { ExternalLink, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { deleteAccount } from "@/features/auth/store/auth-slice";
import { useCreateBillingPortalSessionMutation } from "@/features/subscription/services/billing-api";
import { deleteAccountWorkspaces } from "@/features/workspaces/store/workspaces-slice";
import { ROUTES } from "@/routes/route-paths";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import {
  useDeleteAccountMutation,
  useLazyGetAccountDeletionImpactQuery,
} from "../services/account-api";
import type {
  AccountDeletionImpact,
  AccountDeletionReason,
} from "../types/deletion";

const reasons: AccountDeletionReason[] = [
  "price",
  "not_using",
  "difficult_to_use",
  "missing_features",
  "technical_issues",
  "privacy",
  "moving_service",
  "other",
];

function latestDate(dates: Array<string | null>) {
  const validDates = dates.filter((date): date is string => Boolean(date));
  if (!validDates.length) return null;
  return validDates.reduce((latest, date) =>
    new Date(date) > new Date(latest) ? date : latest
  );
}

export function AccountDangerZone() {
  const { t, i18n } = useTranslation("account");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const workspaces = useAppSelector((state) => state.workspaces.items);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState<AccountDeletionReason | null>(null);
  const [comment, setComment] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [googleVerified, setGoogleVerified] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [getImpact, { data: serverImpact, isFetching: isLoadingImpact }] =
    useLazyGetAccountDeletionImpactQuery();
  const [requestDeletion, { isLoading: isDeleting }] =
    useDeleteAccountMutation();
  const [createBillingPortalSession, { isLoading: isOpeningPortal }] =
    useCreateBillingPortalSessionMutation();

  const localImpact = useMemo<AccountDeletionImpact>(() => {
    const ownedWorkspaces = workspaces
      .filter((workspace) => workspace.ownerId === user?.id)
      .map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        memberCount: workspace.members.length,
        subscriptionStatus: workspace.subscriptionStatus,
        cancelAtPeriodEnd: workspace.billing?.cancelAtPeriodEnd ?? false,
        currentPeriodEndsAt: workspace.billing?.currentPeriodEndsAt ?? null,
      }));
    const externalWorkspaces = workspaces
      .filter(
        (workspace) =>
          workspace.ownerId !== user?.id &&
          workspace.members.some((member) => member.id === user?.id)
      )
      .map(({ id, name }) => ({ id, name }));
    const blockingWorkspaces = ownedWorkspaces.filter(
      (workspace) =>
        (workspace.subscriptionStatus === "active" &&
          !workspace.cancelAtPeriodEnd) ||
        workspace.subscriptionStatus === "past_due"
    );

    return {
      ownedWorkspaces,
      externalWorkspaces,
      blocked: blockingWorkspaces.length > 0,
      availableAt: latestDate(
        blockingWorkspaces.map((workspace) => workspace.currentPeriodEndsAt)
      ),
    };
  }, [user?.id, workspaces]);

  const impact = serverImpact ?? localImpact;
  const blockingWorkspace = impact.ownedWorkspaces.find(
    (workspace) =>
      (workspace.subscriptionStatus === "active" &&
        !workspace.cancelAtPeriodEnd) ||
      workspace.subscriptionStatus === "past_due"
  );
  const cancelingWorkspace = impact.ownedWorkspaces.find(
    (workspace) =>
      workspace.subscriptionStatus === "active" && workspace.cancelAtPeriodEnd
  );
  const locale = i18n.resolvedLanguage?.startsWith("pt-BR") ? "pt-BR" : "en-US";
  const confirmationPhrase = t("deletion.confirmationPhrase");
  const otherReasonInvalid = reason === "other" && !comment.trim();
  const reauthenticated =
    user?.identity.provider === "google" ? googleVerified : Boolean(password);
  const canDelete =
    confirmation.trim() === confirmationPhrase &&
    reauthenticated &&
    !isDeleting;

  const reset = () => {
    setStep(1);
    setReason(null);
    setComment("");
    setConfirmation("");
    setPassword("");
    setGoogleVerified(false);
    setServerError(null);
  };

  const close = () => {
    if (isDeleting) return;
    setOpen(false);
    reset();
  };

  const openDeletion = () => {
    reset();
    setOpen(true);
    void getImpact();
  };

  const openBillingPortal = async () => {
    if (!blockingWorkspace) return;
    const portalWindow = window.open("about:blank", "_blank");
    if (portalWindow) portalWindow.opener = null;
    try {
      const { url } = await createBillingPortalSession({
        workspaceId: blockingWorkspace.id,
      }).unwrap();
      if (portalWindow) portalWindow.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      portalWindow?.close();
      toast.error(t("deletion.billingPortalError"));
    }
  };

  const submitDeletion = async () => {
    if (!user || !reason || !canDelete || impact.blocked) return;
    setServerError(null);
    try {
      await requestDeletion({
        reason,
        comment: comment.trim() || undefined,
        reauthentication:
          user.identity.provider === "google"
            ? {
                provider: "google",
                // A integração OIDC real substituirá este valor pela credencial
                // recente devolvida pelo provedor.
                credential: `google-reauth:${user.identity.providerSubject}`,
              }
            : { provider: "password", password },
        idempotencyKey: globalThis.crypto.randomUUID(),
      }).unwrap();
      dispatch(
        deleteAccountWorkspaces({ userId: user.id, userEmail: user.email })
      );
      dispatch(deleteAccount({ userId: user.id }));
      toast.success(t("deletion.success"));
      navigate(ROUTES.login, { replace: true });
    } catch {
      setServerError(t("deletion.error"));
    }
  };

  return (
    <>
      <SectionCard
        className="mt-6"
        icon={Trash2}
        iconClassName="bg-red-500/10 text-red-600 dark:text-red-400"
        title={t("deletion.title")}
        description={t("deletion.description")}
      >
        <div className="mt-6">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("deletion.warning")}
          </p>
          <Button
            className="mt-5 bg-red-600 text-white hover:bg-red-700"
            type="button"
            onClick={openDeletion}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t("deletion.open")}
          </Button>
        </div>
      </SectionCard>

      <Modal
        closeLabel={t("deletion.close")}
        onClose={close}
        open={open}
        title={t(`deletion.steps.${step}.title`)}
      >
        {step === 1 && (
          <div className="mt-6 space-y-5">
            {isLoadingImpact && !serverImpact ? (
              <p className="text-sm text-muted-foreground" role="status">
                {t("deletion.loadingImpact")}
              </p>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-bold">
                    {t("deletion.ownedWorkspaces")}
                  </h3>
                  {impact.ownedWorkspaces.length ? (
                    <ul className="mt-2 space-y-2">
                      {impact.ownedWorkspaces.map((workspace) => (
                        <li
                          className="rounded-xl bg-muted px-3 py-2 text-sm"
                          key={workspace.id}
                        >
                          <span className="font-semibold">
                            {workspace.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {t("deletion.workspaceMembers", {
                              count: workspace.memberCount,
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("deletion.noOwnedWorkspaces")}
                    </p>
                  )}
                </div>

                {impact.externalWorkspaces.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold">
                      {t("deletion.externalWorkspaces")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("deletion.externalWorkspacesDescription", {
                        count: impact.externalWorkspaces.length,
                      })}
                    </p>
                  </div>
                )}

                {impact.blocked && (
                  <div
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
                    role="alert"
                  >
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      {t("deletion.actionRequired")}
                    </p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                      {t(
                        blockingWorkspace?.subscriptionStatus === "past_due"
                          ? "deletion.pastDueBlockedDescription"
                          : "deletion.activeSubscriptionBlockedDescription"
                      )}
                    </p>
                    <Button
                      className="mt-3"
                      disabled={isOpeningPortal}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => void openBillingPortal()}
                    >
                      {t(
                        blockingWorkspace?.subscriptionStatus === "past_due"
                          ? "deletion.resolvePayment"
                          : "deletion.cancelSubscription"
                      )}
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}

                {!impact.blocked && cancelingWorkspace && (
                  <div
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
                    role="status"
                  >
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      {t("deletion.cancellationScheduled")}
                    </p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                      {cancelingWorkspace.currentPeriodEndsAt
                        ? t("deletion.cancellationScheduledDescription", {
                            date: new Intl.DateTimeFormat(locale, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }).format(
                              new Date(cancelingWorkspace.currentPeriodEndsAt)
                            ),
                          })
                        : t("deletion.cancellationScheduledWithoutDate")}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={close}>
                {t("deletion.cancel")}
              </Button>
              <Button
                disabled={impact.blocked || isLoadingImpact}
                type="button"
                onClick={() => setStep(2)}
              >
                {t("deletion.continue")}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6">
            <fieldset>
              <legend className="text-sm font-bold">
                {t("deletion.reasonQuestion")}
              </legend>
              <div className="mt-3 space-y-2">
                {reasons.map((item) => (
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm hover:bg-muted"
                    key={item}
                  >
                    <input
                      checked={reason === item}
                      name="deletion-reason"
                      type="radio"
                      value={item}
                      onChange={() => setReason(item)}
                    />
                    {t(`deletion.reasons.${item}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            {reason === "other" && (
              <div className="mt-4">
                <label className="text-sm font-medium" htmlFor="other-reason">
                  {t("deletion.otherReasonLabel")}
                </label>
                <textarea
                  aria-invalid={otherReasonInvalid}
                  className="mt-2 min-h-24 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  id="other-reason"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>
            )}
            {reason && reason !== "other" && (
              <div className="mt-4">
                <label className="text-sm font-medium" htmlFor="reason-comment">
                  {t("deletion.optionalComment")}
                </label>
                <textarea
                  className="mt-2 min-h-20 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  id="reason-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>
            )}
            <div className="mt-6 flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                {t("deletion.back")}
              </Button>
              <Button
                disabled={!reason || otherReasonInvalid}
                type="button"
                onClick={() => setStep(3)}
              >
                {t("deletion.continue")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6">
            <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">
              {t("deletion.irreversibleWarning")}
            </div>
            <div className="mt-5">
              <label
                className="text-sm font-medium"
                htmlFor="delete-confirmation"
              >
                {t("deletion.confirmationLabel", {
                  phrase: confirmationPhrase,
                })}
              </label>
              <Input
                className="mt-2"
                id="delete-confirmation"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>

            {user?.identity.provider === "google" ? (
              <div className="mt-5">
                <p className="text-sm font-medium">
                  {t("deletion.googleReauthenticationDescription")}
                </p>
                <Button
                  className="mt-2 w-full"
                  type="button"
                  variant="outline"
                  onClick={() => setGoogleVerified(true)}
                >
                  {googleVerified
                    ? t("deletion.googleReauthenticated")
                    : t("deletion.reauthenticateGoogle")}
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <label
                  className="text-sm font-medium"
                  htmlFor="delete-password"
                >
                  {t("deletion.passwordLabel")}
                </label>
                <Input
                  className="mt-2"
                  id="delete-password"
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            )}

            {serverError && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {serverError}
              </p>
            )}
            <div className="mt-6 flex justify-between gap-3">
              <Button
                disabled={isDeleting}
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
              >
                {t("deletion.back")}
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={!canDelete}
                type="button"
                onClick={() => void submitDeletion()}
              >
                {isDeleting
                  ? t("deletion.deleting")
                  : t("deletion.deletePermanently")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
