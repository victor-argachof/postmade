import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/shared/i18n";
import { SubscriptionConfigurator } from "./subscription-configurator";

describe("SubscriptionConfigurator", () => {
  it("configures quantities and sends them to annual checkout", async () => {
    const user = userEvent.setup();
    const onSubscribe = vi.fn();
    render(
      <SubscriptionConfigurator
        configuration={{ channels: 3, members: 1 }}
        onSubscribe={onSubscribe}
        status="trialing"
      />,
    );

    await user.click(screen.getByRole("button", { name: /aumentar canais|increase channels/i }));
    await user.click(screen.getByRole("button", { name: /aumentar membros|increase members/i }));
    await user.click(screen.getByRole("button", { name: /anual|annual/i }));
    await user.click(screen.getByRole("button", { name: /assinar postmade|subscribe to postmade/i }));

    expect(onSubscribe).toHaveBeenCalledWith({ channels: 4, members: 2 }, "annual");
  });

  it("accepts direct input and normalizes it to the configured maximum", async () => {
    const user = userEvent.setup();
    const onSubscribe = vi.fn();
    render(
      <SubscriptionConfigurator
        configuration={{ channels: 3, members: 1 }}
        onSubscribe={onSubscribe}
        status="trialing"
      />,
    );

    const channels = screen.getByRole("spinbutton", { name: /canais|channels/i });
    await user.clear(channels);
    await user.type(channels, "999");
    await user.tab();
    expect(channels).toHaveValue(500);
  });

  it("does not allow quantities below the subscription minimums", async () => {
    const user = userEvent.setup();
    render(
      <SubscriptionConfigurator
        configuration={{ channels: 3, members: 1 }}
        onSubscribe={vi.fn()}
        status="trialing"
      />,
    );

    const channels = screen.getByRole("spinbutton", { name: /canais|channels/i });
    const members = screen.getByRole("spinbutton", { name: /membros|members/i });
    await user.clear(channels);
    await user.type(channels, "1");
    await user.tab();
    await user.clear(members);
    await user.type(members, "0");
    await user.tab();

    expect(channels).toHaveValue(3);
    expect(members).toHaveValue(1);
  });

  it("keeps active quantities read-only and opens the billing portal", async () => {
    const user = userEvent.setup();
    const onManage = vi.fn();
    render(
      <SubscriptionConfigurator
        configuration={{ channels: 25, members: 4 }}
        currentBillingCycle="monthly"
        onManage={onManage}
        status="active"
      />,
    );

    expect(screen.getByRole("spinbutton", { name: /canais|channels/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /gerenciar assinatura|manage subscription/i }));
    expect(onManage).toHaveBeenCalledOnce();
  });
});
