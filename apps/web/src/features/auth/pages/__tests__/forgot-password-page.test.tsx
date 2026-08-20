import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll, vi } from "vitest";

import i18n from "@/shared/i18n";
import { store } from "@/shared/store";

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
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              challengeId: "challenge",
              expiresAt: new Date().toISOString(),
              resendAvailableAt: new Date().toISOString(),
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
      )
    );
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </Provider>
    );

    const email = screen.getByLabelText("E-mail");
    const submitButton = screen.getByRole("button", {
      name: /enviar link de redefinição/i,
    });

    await user.click(submitButton);
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();

    await user.type(email, "email-invalido");
    expect(
      screen.getByText("Digite um endereço de e-mail válido.")
    ).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, "user@postmade.app");
    await user.click(submitButton);

    expect(
      await screen.findByLabelText("Código de verificação")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar para o login/i })
    ).toHaveAttribute("href", "/login");
  });
});
