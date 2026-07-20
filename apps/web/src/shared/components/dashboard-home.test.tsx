import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardHome } from "./dashboard-home";
import "@/shared/i18n";

describe("DashboardHome", () => {
  it("shows the initial MVP modules", () => {
    render(<MemoryRouter><DashboardHome /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /publica|posts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /canais|channels/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /calend/i })).toBeInTheDocument();
  });
});
