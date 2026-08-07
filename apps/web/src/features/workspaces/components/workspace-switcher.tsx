import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";
import { useDismissibleDetails } from "@/shared/hooks/use-dismissible-details";
import { cn } from "@/shared/lib/utils";

import { createWorkspace, selectWorkspace } from "../store/workspaces-slice";

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation("workspaces");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { items, activeWorkspaceId } = useAppSelector(
    (state) => state.workspaces
  );
  const workspaces = user
    ? items.filter((workspace) =>
        workspace.members.some((member) => member.id === user.id)
      )
    : [];
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId
  );
  const menuRef = useDismissibleDetails();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [switchingWorkspaceName, setSwitchingWorkspaceName] = useState<
    string | null
  >(null);
  const switchTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (switchTimerRef.current !== null)
        window.clearTimeout(switchTimerRef.current);
    },
    []
  );

  const chooseWorkspace = (workspaceId: string) => {
    if (!user) return;
    menuRef.current?.removeAttribute("open");
    if (workspaceId === activeWorkspaceId) return;

    const workspace = workspaces.find((item) => item.id === workspaceId);
    if (!workspace) return;

    setSwitchingWorkspaceName(workspace.name);
    switchTimerRef.current = window.setTimeout(() => {
      dispatch(selectWorkspace({ workspaceId, userId: user.id }));
      setSwitchingWorkspaceName(null);
      switchTimerRef.current = null;
    }, 1_200);
  };

  const submitWorkspace = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    dispatch(
      createWorkspace({
        name,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      })
    );
    setName("");
    setCreateOpen(false);
  };

  return (
    <>
      <details ref={menuRef} className={cn("group relative", className)}>
        <summary
          aria-label={t("switcherLabel")}
          className="flex w-full cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:max-w-xs [&::-webkit-details-marker]:hidden"
        >
          <Building2
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span className="truncate text-sm font-bold">
            {activeWorkspace?.name ?? t("selectWorkspace")}
          </span>
          <ChevronsUpDown
            className="ml-auto size-4 shrink-0 text-muted-foreground md:ml-0"
            aria-hidden="true"
          />
        </summary>
        <div className="absolute left-0 z-50 mt-2 w-full min-w-0 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/10 md:w-72 md:min-w-72">
          <p className="px-3 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("yourWorkspaces")}
          </p>
          <div className="max-h-64 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => chooseWorkspace(workspace.id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {workspace.name}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {workspace.subscriptionStatus === "trialing" ? (
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] leading-none font-bold text-secondary-foreground">
                        {t("freeTrialBadge")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("subscriptionQuantities", {
                          channels: t(
                            `channelCount.${workspace.subscriptionConfiguration.channels === 1 ? "singular" : "plural"}`,
                            {
                              count:
                                workspace.subscriptionConfiguration.channels,
                            }
                          ),
                          members: t(
                            `memberCount.${workspace.subscriptionConfiguration.members === 1 ? "singular" : "plural"}`,
                            {
                              count:
                                workspace.subscriptionConfiguration.members,
                            }
                          ),
                        })}
                      </span>
                    )}
                  </span>
                </span>
                {workspace.id === activeWorkspaceId && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
          {user && (
            <button
              type="button"
              onClick={() => {
                menuRef.current?.removeAttribute("open");
                setCreateOpen(true);
              }}
              className="mt-2 flex w-full cursor-pointer items-center gap-3 border-t border-border px-3 pt-4 pb-2 text-sm font-bold text-primary hover:underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("createWorkspace")}
            </button>
          )}
        </div>
      </details>

      {switchingWorkspaceName &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex min-h-dvh w-screen items-center justify-center bg-background px-6"
            role="status"
            aria-live="polite"
            aria-label={t("switchingWorkspace", {
              name: switchingWorkspaceName,
            })}
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-transparent"
              aria-hidden="true"
            >
              <span className="workspace-loading-progress block h-full bg-primary" />
            </div>
            <div className="flex max-w-sm flex-col items-center text-center">
              <div className="relative grid size-16 place-items-center">
                <img
                  className="workspace-logo-pulse size-14 object-contain"
                  src="/postmade-logo.png"
                  alt=""
                  aria-hidden="true"
                />
              </div>
              <p className="mt-6 text-lg font-black">{t("switchingTitle")}</p>
              <p className="mt-2 max-w-xs truncate text-sm text-muted-foreground">
                {switchingWorkspaceName}
              </p>
            </div>
          </div>,
          document.body
        )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("createTitle")}
        closeLabel={t("closeCreate")}
      >
        <form className="mt-6" onSubmit={submitWorkspace}>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("createDescription")}
          </p>
          <label
            className="mt-5 block text-sm font-medium"
            htmlFor="new-workspace-name"
          >
            {t("workspaceName")}
          </label>
          <Input
            autoFocus
            className="mt-2"
            id="new-workspace-name"
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t("create")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
