import { LoaderCircle } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useGetWorkspacesQuery } from "@/features/workspaces/services/workspaces-api";
import {
  clearWorkspaceSession,
  hydrateWorkspaces,
} from "@/features/workspaces/store/workspaces-slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { useMeQuery } from "../services/auth-api";
import { clearSession, setSession } from "../store/auth-slice";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector((state) => state.auth.user);
  const { data: apiUser, isLoading, isError } = useMeQuery();
  const { data: workspaces, isLoading: workspacesLoading } =
    useGetWorkspacesQuery(undefined, { skip: !sessionUser });
  useEffect(() => {
    if (apiUser)
      dispatch(
        setSession({
          ...apiUser,
          identity: { ...apiUser.identity, providerSubject: apiUser.id },
        })
      );
    else if (isError) {
      dispatch(clearSession());
      dispatch(clearWorkspaceSession());
    }
  }, [apiUser, dispatch, isError]);
  useEffect(() => {
    if (sessionUser && workspaces)
      dispatch(
        hydrateWorkspaces(
          workspaces.map((workspace) => ({ ...workspace, user: sessionUser }))
        )
      );
  }, [dispatch, sessionUser, workspaces]);
  const isRestoringSession = Boolean(apiUser && !sessionUser);
  if (isLoading || isRestoringSession || (sessionUser && workspacesLoading))
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-primary"
        role="status"
        aria-label="Carregando Postmade"
      >
        <LoaderCircle className="size-8 animate-spin" aria-hidden="true" />
      </div>
    );
  return children;
}
