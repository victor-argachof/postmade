import { render, screen } from "@testing-library/react";
import "@/shared/i18n";
import { ROUTES } from "@/routes/route-paths";
import { AppFooter } from "./app-footer";

describe("AppFooter", () => {
  it("shows the attribution and opens every link in a new tab", () => {
    render(<AppFooter />);

    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
    expect(screen.getByLabelText(/amor|love/i)).toBeInTheDocument();

    const expectedLinks = [
      { name: /termos de uso|terms of use/i, href: ROUTES.termsOfUse },
      { name: /política de privacidade|privacy policy/i, href: ROUTES.privacyPolicy },
      { name: /suporte|support/i, href: "mailto:support@postmade.app" },
    ];

    expectedLinks.forEach(({ name, href }) => {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
