import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/shared/store";
import "@/shared/i18n";
import { AppRouter } from "../app-router";
import { ROUTES } from "../route-paths";

describe("AppRouter", () => {
  it("redirects the root path to the dashboard route", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[ROUTES.home]}>
          <AppRouter />
        </MemoryRouter>
      </Provider>,
    );

    expect(await screen.findByRole("heading", { name: /crie uma vez|create once/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /configurações|settings/i })).toHaveAttribute("href", ROUTES.workspaceSettings);
    expect(screen.getByRole("link", { name: /assinatura|subscription/i })).toHaveAttribute("href", ROUTES.workspaceSubscription);
  });
});
