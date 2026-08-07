import { render, screen } from "@testing-library/react";
import "@/shared/i18n";
import { SubscriptionPage } from "../subscription-page";
import { Provider } from "react-redux";
import { store } from "@/shared/store";
import { MemoryRouter } from "react-router-dom";

describe("SubscriptionPage", () => {
  it("presents the active trial progress", () => {
    render(<Provider store={store}><MemoryRouter><SubscriptionPage /></MemoryRouter></Provider>);

    expect(screen.getByRole("heading", { level: 1, name: /assinatura|subscription/i })).toBeInTheDocument();
    expect(screen.getByText(/15 de 15 dias restantes|15 of 15 days remaining/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /posts utilizados|posts used/i })).toHaveAttribute("aria-valuemax", "3");
    expect(screen.getByRole("progressbar", { name: /canais conectados|connected channels/i })).toHaveAttribute("aria-valuemax", "3");
    expect(screen.queryByText(/cartão de crédito|credit card required/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /configurar assinatura|configure subscription/i })).toBeEnabled();
    expect(screen.getByRole("heading", { level: 2, name: /configure sua assinatura|configure your subscription/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /assinar postmade|subscribe to postmade/i })).toBeEnabled();
  });

  it("scrolls to the configurator when opened through its direct link", () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, "scrollIntoView");

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/workspace/subscription#subscription-configurator"]}>
          <SubscriptionPage />
        </MemoryRouter>
      </Provider>,
    );

    return vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    }));
  });
});
