import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { setSession } from "@/features/auth/store/auth-slice";
import { store } from "@/shared/store";

import { createInitialWorkspace } from "../../store/workspaces-slice";

import "@/shared/i18n";

import { WorkspaceSettingsPage } from "../workspace-settings-page";

describe("WorkspaceSettingsPage", () => {
  it("keeps workspace settings outside the personal account area", () => {
    const user = {
      userId: "user:workspace-owner@postmade.app",
      userName: "Workspace Owner",
      userEmail: "workspace-owner@postmade.app",
    };
    store.dispatch(
      setSession({
        name: user.userName,
        email: user.userEmail,
        identity: { provider: "password", emailVerified: true },
      })
    );
    store.dispatch(createInitialWorkspace(user));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <WorkspaceSettingsPage />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /configurações do workspace|workspace settings/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: /nome do workspace|workspace name/i,
      })
    ).toHaveValue("Workspace de Workspace Owner");
    expect(
      screen.getByRole("heading", {
        name: /membros do workspace|workspace members/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: /fuso horário do workspace|workspace time zone/i,
      })
    ).toBeInTheDocument();
  });

  it("confirms a timezone change and preserves it on the workspace", async () => {
    const user = userEvent.setup();
    store.dispatch(
      setSession({
        name: "Timezone Owner",
        email: "timezone-owner@postmade.app",
        identity: { provider: "password", emailVerified: true },
      })
    );
    const currentUser = store.getState().auth.user!;
    const authUser = {
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
    };
    store.dispatch(createInitialWorkspace(authUser));
    render(
      <Provider store={store}>
        <MemoryRouter>
          <WorkspaceSettingsPage />
        </MemoryRouter>
      </Provider>
    );
    const input = screen.getByRole("combobox", {
      name: /fuso horário do workspace|workspace time zone/i,
    });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Europe/Lisbon" }));
    await user.click(
      screen.getByRole("button", {
        name: /salvar fuso horário|save time zone/i,
      })
    );
    await user.click(
      screen.getByRole("button", {
        name: /confirmar alteração|confirm change/i,
      })
    );
    expect(
      store
        .getState()
        .workspaces.items.find(
          (workspace) =>
            workspace.id === store.getState().workspaces.activeWorkspaceId
        )?.timezone
    ).toBe("Europe/Lisbon");
  });
});
