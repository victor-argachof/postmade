import { render, screen } from "@testing-library/react";
import "@/shared/i18n";
import { TrialDetailsCard } from "./trial-details-card";

describe("TrialDetailsCard", () => {
  it("shows the remaining time and trial end date", () => {
    render(
      <TrialDetailsCard
        remainingDays={8}
        totalDays={15}
        trialEndsAt="2026-08-15T12:00:00.000Z"
      />,
    );

    expect(screen.getByText(/^avaliação gratuita$|^free trial$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^plano atual$|^current plan$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/8 de 15 dias restantes|8 of 15 days remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/15 de agosto de 2026|august 15, 2026/i)).toBeInTheDocument();
  });

});
