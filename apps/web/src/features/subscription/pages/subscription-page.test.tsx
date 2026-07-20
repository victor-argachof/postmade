import { render, screen } from "@testing-library/react";
import "@/shared/i18n";
import { SubscriptionPage } from "./subscription-page";

describe("SubscriptionPage", () => {
  it("presents the active trial progress", () => {
    render(<SubscriptionPage />);

    expect(screen.getByRole("heading", { level: 1, name: /assinatura|subscription/i })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /tempo restante|time remaining/i })).toHaveAttribute("aria-valuenow", "15");
    expect(screen.getByText(/sem cadastrar um cartão|without adding a card/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /assinar agora|subscribe now/i })).toBeDisabled();
  });
});
