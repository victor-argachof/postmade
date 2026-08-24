import { MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/routes/route-paths";
import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import {
  useAcceptWorkspaceInvitationMutation,
  useGetInvitationDetailsQuery,
} from "../services/workspaces-api";
import { activateAcceptedWorkspace } from "../store/workspaces-slice";

export function WorkspaceInvitationPage() {
  const { t } = useTranslation("workspaces");
  const { t: tApiError } = useTranslation("apiErrors");
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetInvitationDetailsQuery(token, {
    skip: !token,
  });
  const [accept, { isLoading: isAccepting }] =
    useAcceptWorkspaceInvitationMutation();
  const authSuffix = `?invite=${encodeURIComponent(token)}`;

  const submit = async () => {
    try {
      const result = await accept(token).unwrap();
      dispatch(activateAcceptedWorkspace({ workspaceId: result.workspaceId }));
      toast.success(t("invitationAccepted"));
      navigate(ROUTES.dashboard);
    } catch (acceptError) {
      toast.error(tApiError(getApiErrorTranslationKey(acceptError)));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <SectionCard
        className="w-full"
        icon={MailCheck}
        title={t("invitationTitle")}
        description={t("invitationDescription")}
      >
        {isLoading ? (
          <p className="mt-6">{t("loadingInvitation")}</p>
        ) : error || !data ? (
          <p className="text-destructive mt-6">
            {tApiError(getApiErrorTranslationKey(error))}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p>
              {t("invitationSummary", {
                inviter: data.invitedByName,
                workspace: data.workspaceName,
                role: t(`roles.${data.role}`),
              })}
            </p>
            <p className="text-sm text-muted-foreground">{data.email}</p>
            {data.status !== "pending" ? (
              <p>{t(`invitationStatuses.${data.status}`)}</p>
            ) : user ? (
              <Button
                className="w-full"
                disabled={
                  isAccepting ||
                  user.email.toLowerCase() !== data.email.toLowerCase()
                }
                onClick={() => void submit()}
              >
                {t("acceptInvitation")}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Link
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
                  to={`${ROUTES.login}${authSuffix}`}
                >
                  {t("loginToAccept")}
                </Link>
                <Link
                  className="flex-1 rounded-md border border-input px-4 py-2 text-center text-sm font-medium"
                  to={`${ROUTES.register}${authSuffix}`}
                >
                  {t("registerToAccept")}
                </Link>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </main>
  );
}
