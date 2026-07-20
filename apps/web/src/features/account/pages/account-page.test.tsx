import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/app/store";
import "@/shared/i18n";
import { AccountPage } from "./account-page";

describe("AccountPage", () => {
  it("renders the profile settings form", () => {
    render(
      <Provider store={store}>
        <MemoryRouter><AccountPage /></MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /minha conta|my account/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /nome|name/i })).toBeInTheDocument();
  });
});
