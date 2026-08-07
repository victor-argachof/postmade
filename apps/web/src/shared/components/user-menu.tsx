import { LogOut, UserRound, UserRoundCog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { clearSession } from "@/features/auth/store/auth-slice";
import { clearWorkspaceSession } from "@/features/workspaces/store/workspaces-slice";
import { ROUTES } from "@/routes/route-paths";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";
import { useDismissibleDetails } from "@/shared/hooks/use-dismissible-details";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const menuRef = useDismissibleDetails();
  const { t } = useTranslation("account");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const name = user?.name ?? t("fallbackName");
  const email = user?.email ?? "user@postmade.app";

  const signOut = () => {
    menuRef.current?.removeAttribute("open");
    dispatch(clearSession());
    dispatch(clearWorkspaceSession());
    navigate(ROUTES.login);
  };

  const openAccount = () => {
    menuRef.current?.removeAttribute("open");
    navigate(ROUTES.account);
  };

  return (
    <details ref={menuRef} className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-1.5 transition outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
        aria-label={t("openMenu")}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-black text-secondary-foreground">
          {getInitials(name) || (
            <UserRound className="size-4" aria-hidden="true" />
          )}
        </span>
        <span className="hidden max-w-36 text-left lg:block">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {email}
          </span>
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/10">
        <div className="border-b border-border px-3 py-3">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <button
          type="button"
          onClick={openAccount}
          className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <UserRoundCog className="size-4" aria-hidden="true" />
          {t("myAccount")}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {t("signOut")}
        </button>
      </div>
    </details>
  );
}
