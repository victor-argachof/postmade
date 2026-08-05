import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";
import "@/shared/i18n";
import { SubscriptionConfigurator } from "./subscription-configurator";

describe("SubscriptionConfigurator", () => {
  it("configures quantities and sends them to checkout", async () => {
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
    await user.click(screen.getByRole("button", { name: /assinar postmade|subscribe to postmade/i }));

    expect(onSubscribe).toHaveBeenCalledWith({ channels: 4, members: 2 });
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

  it("updates active quantities only after confirmation", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(true);
    render(
      <SubscriptionConfigurator
        configuration={{ channels: 25, members: 4 }}
        minimumConfiguration={{ channels: 6, members: 3 }}
        onUpdate={onUpdate}
        status="active"
      />,
    );

    const channels = screen.getByRole("spinbutton", { name: /canais|channels/i });
    expect(channels).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /aumentar canais|increase channels/i }));
    await user.click(screen.getByRole("button", { name: /atualizar assinatura|update subscription/i }));
    expect(onUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /confirmar alteração|confirm change/i }));
    expect(onUpdate).toHaveBeenCalledWith({ channels: 26, members: 4 });
  });

  it("does not let an active subscription be reduced below current usage", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SubscriptionConfigurator
          configuration={{ channels: 8, members: 3 }}
          minimumConfiguration={{ channels: 6, members: 3 }}
          onUpdate={vi.fn().mockResolvedValue(true)}
          status="active"
          usage={{ connectedChannels: 6, members: 2, pendingInvitations: 1 }}
        />
      </MemoryRouter>,
    );

    const channels = screen.getByRole("spinbutton", { name: /canais|channels/i });
    const decreaseMembers = screen.getByRole("button", { name: /diminuir membros|decrease members/i });
    await user.clear(channels);
    await user.type(channels, "2");
    await user.tab();

    expect(channels).toHaveValue(6);
    expect(decreaseMembers).toHaveAttribute("aria-disabled", "true");
    await user.click(decreaseMembers);
    expect(screen.getByRole("dialog", { name: /não pode reduzir|can't reduce/i })).toBeInTheDocument();
    expect(screen.getByText(/3 vagas ocupadas|3 occupied spots/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gerenciar membros|manage members/i })).toHaveAttribute(
      "href",
      ROUTES.workspaceMembers,
    );
  });
});
