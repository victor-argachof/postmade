import { LayoutDashboard, Send } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";
import { SidebarNavigation } from "./sidebar-navigation";

describe("SidebarNavigation", () => {
  it("renders shared navigation items for either sidebar variant", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.posts]}>
        <SidebarNavigation
          ariaLabel="Main navigation"
          items={[
            { to: ROUTES.dashboard, label: "Overview", icon: LayoutDashboard },
            { to: ROUTES.posts, label: "Posts", icon: Send },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Posts" })).toHaveAttribute("aria-current", "page");
  });
});
