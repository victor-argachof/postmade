import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll } from "vitest";
import i18n from "@/shared/i18n";
import { ForgotPasswordPage } from "../forgot-password-page";

const initialLanguage = i18n.resolvedLanguage ?? "en";

beforeAll(async () => {
  await i18n.changeLanguage("pt-BR");
});

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage);
});

describe("ForgotPasswordPage", () => {
  it("accepts an email and confirms the reset request", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const email = screen.getByLabelText("E-mail");
    const submitButton = screen.getByRole("button", { name: /enviar link de redefinição/i });

    await user.click(submitButton);
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();

    await user.type(email, "email-invalido");
    expect(screen.getByText("Digite um endereço de e-mail válido.")).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, "user@postmade.app");
    await user.click(submitButton);

    expect(screen.getByRole("status")).toHaveTextContent("Solicitação recebida");
    expect(screen.getByRole("link", { name: /voltar para o login/i })).toHaveAttribute("href", "/login");
  });
});
