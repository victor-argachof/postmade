import { Building2, Copy, LockKeyhole, MailPlus, Settings2, Trash2, UserRoundCog, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/routes/route-paths";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { SectionCard } from "@/shared/components/section-card";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";
import {
  changeMemberRole,
  inviteMember,
  removeMember,
  renameWorkspace,
  revokeInvitation,
} from "../store/workspaces-slice";
import { getWorkspaceMemberLimit } from "../lib/workspace-limits";
import type { WorkspaceRole } from "../types";

const roles: Array<Exclude<WorkspaceRole, "owner">> = ["admin", "editor", "viewer"];

export function WorkspaceSettings() {
  const { t } = useTranslation("workspaces");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) => state.workspaces.items.find(
    (item) => item.id === state.workspaces.activeWorkspaceId,
  ));
  const [name, setName] = useState(workspace?.name ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<WorkspaceRole, "owner">>("editor");

  useEffect(() => setName(workspace?.name ?? ""), [workspace?.id, workspace?.name]);
  if (!workspace || !user) return null;

  const currentMember = workspace.members.find((member) => member.id === user.id);
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";
  const isOwner = currentMember?.role === "owner";
  const memberLimit = getWorkspaceMemberLimit(workspace.subscriptionConfiguration, workspace.subscriptionStatus);
  const pendingInvitations = workspace.invitations.filter((invitation) => invitation.status === "pending");
  const occupiedMembers = workspace.members.length + pendingInvitations.length;
  const inviteLocked = workspace.subscriptionStatus === "trialing";

  const saveName = (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(renameWorkspace({ workspaceId: workspace.id, name, actorId: user.id }));
    toast.success(t("nameSaved"));
  };

  const submitInvite = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || inviteLocked || occupiedMembers >= memberLimit) return;
    dispatch(inviteMember({ workspaceId: workspace.id, actorId: user.id, email, role }));
    setEmail("");
    toast.success(t("invitationSent"));
  };

  const invitationUrl = (token: string) => `${window.location.origin}${ROUTES.register}?invite=${encodeURIComponent(token)}`;

  return (
    <>
      <SectionCard
        id="workspace-members"
        className="mt-6"
        icon={Settings2}
        title={t("settingsTitle")}
        description={t("settingsDescription")}
      >
        <form className="mt-8" onSubmit={saveName}>
          <label className="block text-sm font-medium" htmlFor="workspace-name">{t("workspaceName")}</label>
          <Input className="mt-2" id="workspace-name" maxLength={80} value={name} disabled={!canManage} onChange={(event) => setName(event.target.value)} />
          <Button className="mt-5 w-full sm:w-auto" type="submit" disabled={!canManage || !name.trim() || name.trim() === workspace.name}>{t("save")}</Button>
        </form>
      </SectionCard>

      <SectionCard
        className="mt-6"
        icon={Users}
        title={t("teamTitle")}
        description={t("teamDescription")}
        action={<span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold">{t("membersUsage", { used: occupiedMembers, limit: memberLimit })}</span>}
      >
        {inviteLocked ? (
          <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-bold">{t("trialMembersTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("trialMembersDescription")}</p>
                <Button className="mt-4" type="button" onClick={() => navigate(ROUTES.workspaceSubscriptionConfigurator)}>{t("viewPlans")}</Button>
              </div>
            </div>
          </div>
        ) : canManage ? (
          <form className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]" onSubmit={submitInvite}>
            <div>
              <label className="sr-only" htmlFor="invite-email">{t("inviteEmail")}</label>
              <Input id="invite-email" type="email" required placeholder={t("inviteEmail")} value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <select aria-label={t("role")} className="h-11 rounded-xl border border-input bg-background px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              {roles.map((option) => <option key={option} value={option}>{t(`roles.${option}`)}</option>)}
            </select>
            <Button type="submit" disabled={occupiedMembers >= memberLimit}><MailPlus className="size-4" aria-hidden="true" />{t("invite")}</Button>
          </form>
        ) : null}
        {occupiedMembers >= memberLimit && !inviteLocked && <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">{t("limitReached")}</p>}

        <div className="mt-8 divide-y divide-border border-y border-border">
          {workspace.members.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center gap-3 py-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><UserRoundCog className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
              </span>
              {canManage && member.role !== "owner" ? (
                <select aria-label={t("memberRole", { name: member.name })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" value={member.role} onChange={(event) => dispatch(changeMemberRole({ workspaceId: workspace.id, memberId: member.id, role: event.target.value as Exclude<WorkspaceRole, "owner">, actorId: user.id }))}>
                  {roles.map((option) => <option key={option} value={option}>{t(`roles.${option}`)}</option>)}
                </select>
              ) : <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{t(`roles.${member.role}`)}</span>}
              {isOwner && member.role !== "owner" && <Button aria-label={t("removeMember", { name: member.name })} size="icon" variant="ghost" onClick={() => dispatch(removeMember({ workspaceId: workspace.id, memberId: member.id, actorId: user.id }))}><Trash2 className="size-4" aria-hidden="true" /></Button>}
            </div>
          ))}
          {pendingInvitations.map((invitation) => (
            <div key={invitation.id} className="flex flex-wrap items-center gap-3 py-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"><MailPlus className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{invitation.email}</span>
                <span className="block text-xs text-muted-foreground">{t("pendingInvitation")} · {t(`roles.${invitation.role}`)}</span>
              </span>
              <Button aria-label={t("copyInvite")} size="icon" variant="ghost" onClick={() => void navigator.clipboard?.writeText(invitationUrl(invitation.token)).then(() => toast.success(t("inviteCopied")))}><Copy className="size-4" aria-hidden="true" /></Button>
              {canManage && <Button aria-label={t("revokeInvite")} size="icon" variant="ghost" onClick={() => dispatch(revokeInvitation({ workspaceId: workspace.id, invitationId: invitation.id, actorId: user.id }))}><Trash2 className="size-4" aria-hidden="true" /></Button>}
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="size-3.5" aria-hidden="true" />{t("workspaceScopedNote")}</p>
      </SectionCard>
    </>
  );
}
