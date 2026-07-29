import { render, screen } from "@testing-library/react";
import "@/shared/i18n";
import { SubscriptionPage } from "./subscription-page";
import { Provider } from "react-redux";
import { store } from "@/shared/store";

describe("SubscriptionPage", () => {
  it("presents the active trial progress", () => {
    render(<Provider store={store}><SubscriptionPage /></Provider>);

    expect(screen.getByRole("heading", { level: 1, name: /assinatura|subscription/i })).toBeInTheDocument();
    expect(screen.getByText(/15 de 15 dias restantes|15 of 15 days remaining/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /posts utilizados|posts used/i })).toHaveAttribute("aria-valuemax", "3");
    expect(screen.getByRole("progressbar", { name: /canais conectados|connected channels/i })).toHaveAttribute("aria-valuemax", "3");
    expect(screen.queryByText(/cartão de crédito|credit card required/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /selecionar plano|select a plan/i })).toBeEnabled();
    expect(screen.getByRole("heading", { level: 2, name: /escolha o plano|choose the right plan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Creator" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", {
      name: /assinar plano|subscribe to the .* plan/i,
    })).toHaveLength(3);
  });
});
