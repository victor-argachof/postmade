import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, beforeEach } from "vitest";

import i18n from "@/shared/i18n";
import { store } from "@/shared/store";

import { LoginPage } from "../../pages/login-page";
import { clearKnownAccounts, setSession } from "../../store/auth-slice";
import { AuthForm } from "../auth-form";

const initialLanguage = i18n.resolvedLanguage ?? "en";

beforeAll(async () => {
  await i18n.changeLanguage("pt-BR");
});

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage);
});

beforeEach(() => {
  store.dispatch(clearKnownAccounts());
});

function renderForm(mode: "login" | "register") {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AuthForm mode={mode} />} />
          <Route path="/dashboard" element={<p>Dashboard carregado</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("AuthForm", () => {
  it("shows Google sign-in, password recovery and password visibility on login", async () => {
    const user = userEvent.setup();
    renderForm("login");

    expect(
      screen.getByRole("button", { name: /entrar com o google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /esqueci minha senha/i })
    ).toHaveAttribute("href", "/forgot-password");

    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /exibir senha/i }));
    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /ocultar senha/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^entrar$/i }));
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
  });

  it("validates registration passwords while the user types", async () => {
    const user = userEvent.setup();
    renderForm("register");

    const submitButton = screen.getByRole("button", {
      name: /iniciar avaliação gratuita/i,
    });
    const password = screen.getByLabelText("Senha");
    const termsLink = screen.getByRole("link", { name: "Termos de uso" });
    const privacyLink = screen.getByRole("link", {
      name: "Política de privacidade",
    });

    expect(screen.getByLabelText(/força da senha/i)).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
    expect(screen.queryByLabelText("Confirmar senha")).not.toBeInTheDocument();
    expect(termsLink).toHaveAttribute("href", "/terms-of-use");
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(privacyLink).toHaveAttribute("href", "/privacy-policy");
    expect(privacyLink).toHaveAttribute("target", "_blank");

    await user.click(submitButton);
    expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();

    await user.type(password, "Senha@123");
    expect(screen.getByLabelText(/força da senha/i)).toHaveAttribute(
      "aria-valuenow",
      "5"
    );
    expect(screen.queryByText("Informe sua senha.")).not.toBeInTheDocument();
  });

  it("requires the six-digit email code before completing login", async () => {
    const user = userEvent.setup();
    renderForm("login");

    await user.type(screen.getByLabelText("E-mail"), "user@postmade.app");
    await user.type(screen.getByLabelText("Senha"), "minha-senha");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(
      await screen.findByText(
        /enviamos um código de 6 dígitos para user@postmade\.app/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reenviar código (01:00)" })
    ).toBeDisabled();

    const code = screen.getByLabelText("Código de verificação");
    await user.type(code, "00000");
    await user.click(screen.getByRole("button", { name: /^validar$/i }));
    expect(
      await screen.findByText("O código deve conter exatamente 6 dígitos.")
    ).toBeInTheDocument();

    await user.type(code, "7");
    await user.click(screen.getByRole("button", { name: /^validar$/i }));
    expect(await screen.findByText("Dashboard carregado")).toBeInTheDocument();
  });

  it("requires email verification after valid registration data", async () => {
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
    expect(
      screen.getByRole("button", { name: /^validar$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /google/i })
    ).not.toBeInTheDocument();
  });

  it("bypasses email verification when using Google", async () => {
    const user = userEvent.setup();
    renderForm("login");

    await user.click(
      screen.getByRole("button", { name: /entrar com o google/i })
    );

    expect(await screen.findByText("Dashboard carregado")).toBeInTheDocument();
    expect(screen.queryByText("Verifique seu e-mail")).not.toBeInTheDocument();
  });

  it("directs Google accounts back to Google instead of accepting a password", async () => {
    const user = userEvent.setup();
    store.dispatch(
      setSession({
        name: "Google User",
        email: "google@postmade.app",
        identity: {
          provider: "google",
          providerSubject: "google-sub-456",
          emailVerified: true,
        },
      })
    );
    renderForm("login");

    await user.type(screen.getByLabelText("E-mail"), "google@postmade.app");
    await user.type(screen.getByLabelText("Senha"), "qualquer-senha");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/criada com o Google/i);
    expect(screen.queryByText("Verifique seu e-mail")).not.toBeInTheDocument();
  });

  it("does not automatically link a Google login to an existing password account", async () => {
    const user = userEvent.setup();
    store.dispatch(
      setSession({
        name: "Password User",
        email: "password@postmade.app",
        identity: {
          provider: "password",
          providerSubject: "password-sub-789",
          emailVerified: true,
        },
      })
    );
    renderForm("login");

    await user.type(screen.getByLabelText("E-mail"), "password@postmade.app");
    await user.click(
      screen.getByRole("button", { name: /entrar com o google/i })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /entre usando e-mail e senha/i
    );
    expect(screen.queryByText("Dashboard carregado")).not.toBeInTheDocument();
  });

  it("replaces the login title while verifying the email", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<p>Dashboard carregado</p>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByRole("heading", { name: "Bem-vindo de volta" })
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("E-mail"), "user@postmade.app");
    await user.type(screen.getByLabelText("Senha"), "minha-senha");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(
      await screen.findByRole("heading", { name: "Verifique seu e-mail" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Bem-vindo de volta" })
    ).not.toBeInTheDocument();
  });
});
