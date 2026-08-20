import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { setSession } from "@/features/auth/store/auth-slice";
import { createInitialWorkspace } from "@/features/workspaces/store/workspaces-slice";
import { store } from "@/shared/store";

import "@/shared/i18n";

import { AppRouter } from "../app-router";
import { ROUTES } from "../route-paths";

describe("AppRouter", () => {
  it("redirects the root path to the dashboard route", async () => {
    const session = setSession({
      id: "router-user",
      name: "Router User",
      email: "router@postmade.app",
      identity: {
        provider: "password",
        providerSubject: "router",
        emailVerified: true,
      },
    });
    store.dispatch(session);
    store.dispatch(
      createInitialWorkspace({
        userId: session.payload.id,
        userName: session.payload.name,
        userEmail: session.payload.email,
      })
    );
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[ROUTES.home]}>
          <AppRouter />
        </MemoryRouter>
      </Provider>
    );

    expect(
      await screen.findByRole("heading", { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /configurações|settings/i })
    ).toHaveAttribute("href", ROUTES.workspaceSettings);
    expect(
      screen.getByRole("link", { name: /assinatura|subscription/i })
    ).toHaveAttribute("href", ROUTES.workspaceSubscription);
  });
});
