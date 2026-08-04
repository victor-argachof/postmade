import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/shared/i18n";
import { SubscriptionFaq } from "./subscription-faq";

describe("SubscriptionFaq", () => {
  it("shows the subscription questions and expands an answer", async () => {
    const user = userEvent.setup();
    render(<SubscriptionFaq />);

    expect(screen.getAllByRole("button")).toHaveLength(6);
    const pricingQuestion = screen.getByRole("button", {
      name: /como o valor da assinatura é calculado|how is the subscription price calculated/i,
    });
    expect(pricingQuestion).toHaveAttribute("aria-expanded", "false");

    await user.click(pricingQuestion);

    expect(pricingQuestion).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/3 canais e 1 membro|3 channels and 1 member/i)).toBeVisible();
  });
});
