import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { api } from "@/shared/api/api";
import i18n from "@/shared/i18n";
import { store } from "@/shared/store";

import { ForgotPasswordPage } from "../forgot-password-page";

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}));

const initialLanguage = i18n.resolvedLanguage ?? "en";

beforeAll(async () => {
  await i18n.changeLanguage("pt-BR");
});

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage);
});

beforeEach(() => {
  toastSuccess.mockClear();
  store.dispatch(api.util.resetApiState());
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
      name: /enviar código de redefinição/i,
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
    expect(
      screen.queryByText(/informe o e-mail associado à sua conta/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByText("Força da senha")).toBeInTheDocument();
    expect(screen.getByText("8 caracteres ou mais")).toBeInTheDocument();
    expect(screen.getByText("Uma letra maiúscula")).toBeInTheDocument();
    expect(screen.getByText("Uma letra minúscula")).toBeInTheDocument();
    expect(screen.getByText("Um número")).toBeInTheDocument();
    expect(screen.getByText("Um caractere especial")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /voltar para o login/i })
    ).toHaveAttribute("href", "/login");
  });

  it("redirects to login and shows a toast after resetting the password", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes("/password/reset"))
          return new Response(null, { status: 204 });
        return new Response(
          JSON.stringify({
            challengeId: "challenge",
            expiresAt: new Date().toISOString(),
            resendAvailableAt: new Date().toISOString(),
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      })
    );
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/forgot-password"]}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/login" element={<p>Login carregado</p>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    await user.type(screen.getByLabelText("E-mail"), "user@postmade.app");
    await user.click(
      screen.getByRole("button", { name: /enviar código de redefinição/i })
    );
    await user.type(
      await screen.findByLabelText("Código de verificação"),
      "123456"
    );
    await user.type(screen.getByLabelText("Nova senha"), "Senha@123");
    await user.click(
      screen.getByRole("button", { name: /^redefinir senha$/i })
    );

    expect(await screen.findByText("Login carregado")).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith("Senha redefinida com sucesso.");
  });
});
