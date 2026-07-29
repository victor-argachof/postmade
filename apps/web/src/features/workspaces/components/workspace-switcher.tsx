import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
import { useDismissibleDetails } from "@/shared/hooks/use-dismissible-details";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";
import { createWorkspace, selectWorkspace } from "../store/workspaces-slice";
import { cn } from "@/shared/lib/utils";

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation("workspaces");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { items, activeWorkspaceId } = useAppSelector((state) => state.workspaces);
  const workspaces = user
    ? items.filter((workspace) => workspace.members.some((member) => member.id === user.id))
    : [];
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const menuRef = useDismissibleDetails();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  const chooseWorkspace = (workspaceId: string) => {
    if (!user) return;
    dispatch(selectWorkspace({ workspaceId, userId: user.id }));
    menuRef.current?.removeAttribute("open");
  };

  const submitWorkspace = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    dispatch(createWorkspace({
      name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    }));
    setName("");
    setCreateOpen(false);
  };

  return (
    <>
      <details ref={menuRef} className={cn("group relative", className)}>
        <summary
          aria-label={t("switcherLabel")}
          className="flex w-full cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden md:max-w-xs"
        >
          <Building2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate text-sm font-bold">{activeWorkspace?.name ?? t("selectWorkspace")}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </summary>
        <div className="absolute left-0 z-50 mt-2 w-full min-w-0 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/10 md:w-72 md:min-w-72">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("yourWorkspaces")}</p>
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
                  <span className="block truncate text-sm font-semibold">{workspace.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs capitalize text-muted-foreground">
                      {t("planLabel", { plan: workspace.plan })}
                    </span>
                    {workspace.subscriptionStatus === "trialing" && (
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold leading-none text-secondary-foreground">
                        {t("freeTrialBadge")}
                      </span>
                    )}
                  </span>
                </span>
                {workspace.id === activeWorkspaceId && <Check className="size-4 text-primary" aria-hidden="true" />}
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
              className="mt-2 flex w-full cursor-pointer items-center gap-3 border-t border-border px-3 pb-2 pt-4 text-sm font-bold text-primary hover:underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("createWorkspace")}
            </button>
          )}
        </div>
      </details>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("createTitle")} closeLabel={t("closeCreate")}>
        <form className="mt-6" onSubmit={submitWorkspace}>
          <p className="text-sm leading-6 text-muted-foreground">{t("createDescription")}</p>
          <label className="mt-5 block text-sm font-medium" htmlFor="new-workspace-name">{t("workspaceName")}</label>
          <Input
            autoFocus
            className="mt-2"
            id="new-workspace-name"
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={!name.trim()}>{t("create")}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
