import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/shared/store";
import { setSession } from "@/features/auth/store/auth-slice";
import { createInitialWorkspace } from "../store/workspaces-slice";
import "@/shared/i18n";
import { WorkspaceSettingsPage } from "./workspace-settings-page";

describe("WorkspaceSettingsPage", () => {
  it("keeps workspace settings outside the personal account area", () => {
    const user = {
      userId: "user:workspace-owner@postmade.app",
      userName: "Workspace Owner",
      userEmail: "workspace-owner@postmade.app",
    };
    store.dispatch(setSession({
      name: user.userName,
      email: user.userEmail,
      identity: { provider: "password", emailVerified: true },
    }));
    store.dispatch(createInitialWorkspace(user));

    render(
      <Provider store={store}>
        <MemoryRouter><WorkspaceSettingsPage /></MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole("heading", {
      level: 1,
      name: /configurações do workspace|workspace settings/i,
    })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /nome do workspace|workspace name/i })).toHaveValue(
      "Workspace de Workspace Owner",
    );
    expect(screen.getByRole("heading", { name: /membros do workspace|workspace members/i })).toBeInTheDocument();
  });
});
