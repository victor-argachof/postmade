import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/shared/i18n";
import { SubscriptionSummary } from "./subscription-summary";

describe("SubscriptionSummary", () => {
  it("renders trial usage limits", () => {
    render(<SubscriptionSummary status="trialing" />);

    expect(screen.getByRole("heading", {
      name: /uso e limites da avaliação gratuita|free trial usage and limits/i,
    })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", {
      name: /posts utilizados|posts used/i,
    })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", {
      name: /membros do workspace|workspace members/i,
    })).toHaveAttribute("aria-valuemax", "1");
  });

  it.each(["active", "past_due"] as const)(
    "hides the subscription callout for the %s status",
    (status) => {
      render(<SubscriptionSummary status={status} />);

      expect(screen.queryByRole("heading", {
        name: /desbloqueie todo o potencial|unlock postmade's full potential/i,
      })).not.toBeInTheDocument();
    },
  );

  it.each(["trialing", "canceled", "expired"] as const)(
    "shows the subscription callout for the %s status",
    (status) => {
      render(<SubscriptionSummary status={status} />);

      expect(screen.getByRole("heading", {
        name: /desbloqueie todo o potencial|unlock postmade's full potential/i,
      })).toBeInTheDocument();
    },
  );

  it("shows plan limits and identifies unlimited resources", () => {
    render(
      <SubscriptionSummary
        plan="pro"
        status="active"
        postsUsed={12}
        channelsConnected={4}
        membersUsed={3}
      />,
    );

    expect(screen.getAllByText(/ilimitado|unlimited/i)).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: /ilimitado|unlimited/i })).toHaveLength(2);
    expect(screen.getByRole("progressbar", {
      name: /membros do workspace|workspace members/i,
    })).toHaveAttribute("aria-valuemax", "15");
    expect(screen.getByRole("heading", {
      name: /^uso e limites$|^usage and limits$/i,
    })).toBeInTheDocument();
  });

  it("offers an upgrade for an active plan below Pro", async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();

    render(<SubscriptionSummary plan="growth" status="active" onUpgrade={onUpgrade} />);

    await user.click(screen.getByRole("button", {
      name: /ver opções de upgrade|view upgrade options/i,
    }));
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it("does not offer an upgrade for the Pro plan", () => {
    render(<SubscriptionSummary plan="pro" status="active" onUpgrade={() => undefined} />);

    expect(screen.queryByRole("button", {
      name: /ver opções de upgrade|view upgrade options/i,
    })).not.toBeInTheDocument();
  });
});
