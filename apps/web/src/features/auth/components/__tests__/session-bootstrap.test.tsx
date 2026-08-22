import { act, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, vi } from "vitest";

import { hydrateWorkspaces } from "@/features/workspaces/store/workspaces-slice";
import { api } from "@/shared/api/api";
import { useAppSelector } from "@/shared/hooks/store-hooks";
import { store } from "@/shared/store";

import { clearKnownAccounts, setSession } from "../../store/auth-slice";
import { SessionBootstrap } from "../session-bootstrap";

function SessionState() {
  const user = useAppSelector((state) => state.auth.user);
  return <p>{user ? "Sessão disponível" : "Sessão ausente"}</p>;
}

beforeEach(() => {
  store.dispatch(api.util.resetApiState());
  store.dispatch(clearKnownAccounts());
  store.dispatch(hydrateWorkspaces([]));
});

describe("SessionBootstrap", () => {
  it("restores the session before rendering protected content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.endsWith("/me"))
          return new Response(
            JSON.stringify({
              id: "restored-user",
              name: "Grace Hopper",
              email: "grace@postmade.app",
              identity: { provider: "password", emailVerified: true },
              createdAt: "2026-08-22T00:00:00.000Z",
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        if (url.endsWith("/workspaces"))
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        return new Response(null, { status: 404 });
      })
    );

    render(
      <Provider store={store}>
        <SessionBootstrap>
          <SessionState />
        </SessionBootstrap>
      </Provider>
    );

    expect(await screen.findByText("Sessão disponível")).toBeInTheDocument();
    expect(store.getState().auth.user?.id).toBe("restored-user");
  });

  it("loads workspaces when a user authenticates after the anonymous bootstrap", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.endsWith("/me"))
          return new Response(
            JSON.stringify({
              statusCode: 401,
              code: "UNAUTHENTICATED",
              message: "Authentication required",
            }),
            { status: 401, headers: { "content-type": "application/json" } }
          );
        if (url.endsWith("/workspaces"))
          return new Response(
            JSON.stringify([
              {
                id: "workspace-after-login",
                name: "Workspace autenticado",
                ownerId: "user-after-login",
                timezone: "America/Sao_Paulo",
                role: "owner",
                subscriptionStatus: "trialing",
                subscriptionConfiguration: { channels: 3, members: 1 },
                trialStartedAt: "2026-08-22T00:00:00.000Z",
                trialEndsAt: "2026-09-06T00:00:00.000Z",
                createdAt: "2026-08-22T00:00:00.000Z",
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        return new Response(null, { status: 404 });
      })
    );

    render(
      <Provider store={store}>
        <SessionBootstrap>
          <p>Aplicação carregada</p>
        </SessionBootstrap>
      </Provider>
    );

    expect(await screen.findByText("Aplicação carregada")).toBeInTheDocument();

    act(() => {
      store.dispatch(
        setSession({
          id: "user-after-login",
          name: "Ada Lovelace",
          email: "ada@postmade.app",
          identity: { provider: "password", emailVerified: true },
        })
      );
    });

    await waitFor(() => {
      expect(store.getState().workspaces.activeWorkspaceId).toBe(
        "workspace-after-login"
      );
    });
    expect(store.getState().workspaces.items[0]?.name).toBe(
      "Workspace autenticado"
    );
  });
});
