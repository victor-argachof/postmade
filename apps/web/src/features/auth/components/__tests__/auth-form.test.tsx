import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import { api } from "@/shared/api/api";
import i18n from "@/shared/i18n";
import { store } from "@/shared/store";

import { clearKnownAccounts } from "../../store/auth-slice";
import { AuthForm } from "../auth-form";

const initialLanguage = i18n.resolvedLanguage ?? "en";
beforeAll(async () => i18n.changeLanguage("pt-BR"));
afterAll(async () => i18n.changeLanguage(initialLanguage));
beforeEach(() => {
  store.dispatch(clearKnownAccounts());
  store.dispatch(api.util.resetApiState());
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      const payload = url.includes("/verify")
        ? {
            id: "user-1",
            name: "Ada Lovelace",
            email: "ada@postmade.app",
            identity: { provider: "password", emailVerified: true },
            createdAt: new Date().toISOString(),
          }
        : {
            challengeId: "challenge-1",
            expiresAt: new Date(Date.now() + 600000).toISOString(),
            resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
          };
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    })
  );
});
function renderForm(mode: "login" | "register", entry = "/") {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={<AuthForm mode={mode} />} />
          <Route path="/dashboard" element={<p>Dashboard carregado</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("AuthForm", () => {
  it("validates login fields and password visibility", async () => {
    const user = userEvent.setup();
    renderForm("login");
    const password = screen.getByLabelText("Senha");
    await user.click(screen.getByRole("button", { name: /exibir senha/i }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
  });
  it("starts login and verifies a six-digit code through the API", async () => {
    const user = userEvent.setup();
    renderForm("login");
    await user.type(screen.getByLabelText("E-mail"), "user@postmade.app");
    await user.type(screen.getByLabelText("Senha"), "minha-senha");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));
    expect(
      await screen.findByText(/enviamos um código de 6 dígitos/i)
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.click(screen.getByRole("button", { name: /^validar$/i }));
    expect(await screen.findByText("Dashboard carregado")).toBeInTheDocument();
  });
  it("shows the translated API error when the verification code is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes("/verify"))
          return new Response(
            JSON.stringify({
              statusCode: 400,
              code: "INVALID_CODE",
              message: "Verification code is invalid",
            }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        return new Response(
          JSON.stringify({
            challengeId: "challenge-1",
            expiresAt: new Date(Date.now() + 600000).toISOString(),
            resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      })
    );
    const user = userEvent.setup();
    renderForm("login");
    await user.type(screen.getByLabelText("E-mail"), "user@postmade.app");
    await user.type(screen.getByLabelText("Senha"), "minha-senha");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));
    await user.type(screen.getByLabelText("Código de verificação"), "000000");
    await user.click(screen.getByRole("button", { name: /^validar$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O código de verificação é inválido."
    );
  });
  it("starts registration after valid data", async () => {
    const user = userEvent.setup();
    renderForm("register");
    await user.type(screen.getByLabelText("Nome completo"), "Ada Lovelace");
    await user.type(screen.getByLabelText("E-mail"), "ada@postmade.app");
    await user.type(screen.getByLabelText("Senha"), "Senha@123");
    await user.click(
      screen.getByRole("button", { name: /iniciar avaliação gratuita/i })
    );
    expect(
      await screen.findByText(
        /enviamos um código de 6 dígitos para ada@postmade\.app/i
      )
    ).toBeInTheDocument();
  });
  it("locks the invited email during registration", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              workspaceName: "Postmade Studio",
              email: "invitee@postmade.app",
              role: "editor",
              invitedByName: "Ada",
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
              status: "pending",
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          )
      )
    );
    renderForm("register", "/?invite=valid-token");
    const email = screen.getByLabelText("E-mail");
    await waitFor(() => expect(email).toHaveValue("invitee@postmade.app"));
    expect(email).toHaveAttribute("readonly");
    expect(
      screen.getByText(/este convite foi enviado para este e-mail/i)
    ).toBeInTheDocument();
  });
  it("reports Google authentication as unavailable", async () => {
    const user = userEvent.setup();
    renderForm("login");
    await user.click(
      screen.getByRole("button", { name: /entrar com o google/i })
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/próxima etapa/i);
  });
});
