import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/shared/i18n";
import { PricingPlans } from "./pricing-plans";

describe("PricingPlans", () => {
  it("offers checkout for every plan during the trial, including the current plan", async () => {
    const user = userEvent.setup();
    const onSelectPlan = vi.fn();

    render(
      <PricingPlans
        currentPlan="creator"
        status="trialing"
        onSelectPlan={onSelectPlan}
      />,
    );

    expect(screen.getByText(/plano da sua avaliação|your trial plan/i)).toBeInTheDocument();
    const subscribeButtons = screen.getAllByRole("button", {
      name: /assinar plano|subscribe to the .* plan/i,
    });
    expect(subscribeButtons).toHaveLength(3);
    expect(subscribeButtons[0]!).toBeEnabled();

    await user.click(subscribeButtons[1]!);
    expect(onSelectPlan).toHaveBeenCalledWith("growth", "monthly");
  });

  it("keeps the current plan disabled for an active subscription", () => {
    render(
      <PricingPlans
        currentPlan="growth"
        currentBillingCycle="monthly"
        status="active"
        onSelectPlan={() => undefined}
      />,
    );

    expect(screen.getByRole("button", {
      name: /plano atual|current plan/i,
    })).toBeDisabled();
    expect(screen.getAllByRole("button", {
      name: /mudar para|switch to/i,
    })).toHaveLength(2);
  });

  it("allows changing the billing cycle of the current plan", async () => {
    const user = userEvent.setup();
    const onSelectPlan = vi.fn();

    render(
      <PricingPlans
        currentPlan="growth"
        currentBillingCycle="monthly"
        status="active"
        onSelectPlan={onSelectPlan}
      />,
    );

    await user.click(screen.getByRole("button", { name: /anual|annual/i }));
    const switchCycleButton = screen.getByRole("button", {
      name: /mudar para anual|switch to annual/i,
    });
    expect(switchCycleButton).toBeEnabled();

    await user.click(switchCycleButton);
    expect(onSelectPlan).toHaveBeenCalledWith("growth", "annual");
  });

  it("treats legacy active subscriptions without a stored cycle as monthly", async () => {
    const user = userEvent.setup();

    render(
      <PricingPlans
        currentPlan="creator"
        status="active"
        onSelectPlan={() => undefined}
      />,
    );

    expect(screen.getByRole("button", {
      name: /plano atual|current plan/i,
    })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /anual|annual/i }));
    expect(screen.getByRole("button", {
      name: /mudar para anual|switch to annual/i,
    })).toBeEnabled();
  });
});
