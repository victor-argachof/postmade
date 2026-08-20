import { useEffect, type ReactNode } from "react";

import { useGetWorkspacesQuery } from "@/features/workspaces/services/workspaces-api";
import {
  clearWorkspaceSession,
  hydrateWorkspaces,
} from "@/features/workspaces/store/workspaces-slice";
import { useAppDispatch } from "@/shared/hooks/store-hooks";

import { useMeQuery } from "../services/auth-api";
import { clearSession, setSession } from "../store/auth-slice";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: user, isLoading, isError } = useMeQuery();
  const { data: workspaces, isLoading: workspacesLoading } =
    useGetWorkspacesQuery(undefined, { skip: !user });
  useEffect(() => {
    if (user)
      dispatch(
        setSession({
          ...user,
          identity: { ...user.identity, providerSubject: user.id },
        })
      );
    else if (isError) {
      dispatch(clearSession());
      dispatch(clearWorkspaceSession());
    }
  }, [dispatch, isError, user]);
  useEffect(() => {
    if (user && workspaces)
      dispatch(
        hydrateWorkspaces(
          workspaces.map((workspace) => ({ ...workspace, user }))
        )
      );
  }, [dispatch, user, workspaces]);
  if (isLoading || (user && workspacesLoading))
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando Postmade…
      </div>
    );
  return children;
}
