import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/app/store";
import { setSession } from "@/features/auth/store/auth-slice";
import "@/shared/i18n";
import { WorkspaceSwitcher } from "./workspace-switcher";

describe("WorkspaceSwitcher", () => {
  it("keeps focus while typing, creates the workspace, and closes the modal", async () => {
    const user = userEvent.setup();
    store.dispatch(setSession({
      name: "Ada Lovelace",
      email: "ada-switcher@postmade.app",
      provider: "email",
    }));

    render(
      <Provider store={store}>
        <MemoryRouter><WorkspaceSwitcher /></MemoryRouter>
      </Provider>,
    );

    await user.click(screen.getByLabelText(/alternar workspace|switch workspace/i));
    await user.click(screen.getByRole("button", { name: /criar novo workspace|create new workspace/i }));

    const nameInput = screen.getByRole("textbox", { name: /nome do workspace|workspace name/i });
    await user.type(nameInput, "Cliente ACME");

    expect(nameInput).toHaveValue("Cliente ACME");
    expect(nameInput).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /^criar$|^create workspace$/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().workspaces.items.find((workspace) => workspace.name === "Cliente ACME"))
      .toBeDefined();
  });
});
