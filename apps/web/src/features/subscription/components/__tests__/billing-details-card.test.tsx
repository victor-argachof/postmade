import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/shared/i18n";
import { BillingDetailsCard } from "../billing-details-card";

describe("BillingDetailsCard", () => {
  it("shows renewal, amount, contracted resources, and the management action", async () => {
    const user = userEvent.setup();
    const onManage = vi.fn();

    render(
      <BillingDetailsCard
        configuration={{ channels: 50, members: 5 }}
        status="active"
        currentPeriodEndsAt="2026-08-15T12:00:00.000Z"
        currency="BRL"
        nextInvoiceAmount={24900}
        canManage
        onManage={onManage}
      />,
    );

    expect(screen.getByText(/^ativa$|^active$/i)).toHaveClass("bg-emerald-500/10");
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText(/^mensal$|^monthly$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/15 de agosto de 2026|august 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*249[.,]00|BRL\s*249[.,]00/i)).toBeInTheDocument();
    expect(screen.queryByText(/forma de pagamento|payment method/i)).not.toBeInTheDocument();

    const manageButtons = screen.getAllByRole("button", {
      name: /gerenciar assinatura|manage subscription/i,
    });
    expect(manageButtons).toHaveLength(2);
    await user.click(manageButtons[0]!);
    expect(onManage).toHaveBeenCalledOnce();
  });

  it("explains a scheduled cancellation and disables management for non-owners", () => {
    render(
      <BillingDetailsCard
        configuration={{ channels: 15, members: 1 }}
        status="active"
        currentPeriodEndsAt="2026-09-20T12:00:00.000Z"
        cancelAtPeriodEnd
      />,
    );

    expect(screen.getByText(/cancelamento está agendado|cancellation is scheduled/i)).toBeInTheDocument();
    const manageButtons = screen.getAllByRole("button", {
      name: /gerenciar assinatura|manage subscription/i,
    });
    expect(manageButtons).toHaveLength(2);
    manageButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("highlights a past-due payment", () => {
    render(
      <BillingDetailsCard
        configuration={{ channels: 100, members: 15 }}
        status="past_due"
        canManage
        onManage={() => undefined}
      />,
    );

    expect(screen.getByText(/pagamento pendente|payment past due/i)).toHaveClass("bg-amber-500/10");
    expect(screen.getByText(/atualize sua forma de pagamento|update your payment method/i)).toBeInTheDocument();
  });
});
