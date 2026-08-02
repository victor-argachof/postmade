import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { store } from "@/shared/store";
import { clearKnownAccounts, setSession } from "@/features/auth/store/auth-slice";
import i18n from "@/shared/i18n";
import { AccountPage } from "./account-page";

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
  store.dispatch(clearKnownAccounts());
  store.dispatch(setSession({
    name: "Creator Example",
    email: "creator@postmade.app",
    identity: { provider: "password", emailVerified: true },
  }));
});

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter><AccountPage /></MemoryRouter>
    </Provider>,
  );
}

describe("AccountPage", () => {
  it("validates and saves profile changes", async () => {
    const user = userEvent.setup();
    renderPage();

    const name = screen.getByRole("textbox", { name: "Nome completo" });
    const saveButton = screen.getByRole("button", { name: "Salvar alterações" });

    expect(screen.getByRole("heading", { level: 1, name: "Minha conta" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "E-mail" })).not.toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await user.clear(name);
    await user.tab();
    expect(await screen.findByText("Informe seu nome completo.")).toBeInTheDocument();

    await user.type(name, "Ada");
    expect(await screen.findByText("Informe nome e sobrenome.")).toBeInTheDocument();

    await user.type(name, " Lovelace");
    expect(screen.queryByText("Informe nome e sobrenome.")).not.toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    expect(toastSuccess).toHaveBeenCalledWith("Alterações salvas nesta sessão.");
    expect(saveButton).toBeDisabled();
  });

  it("changes the email only after code verification", async () => {
    const user = userEvent.setup();
    const originalUserId = store.getState().auth.user?.id;
    renderPage();

    const newEmail = screen.getByRole("textbox", { name: "Novo e-mail" });
    const sendCode = screen.getByRole("button", { name: "Enviar código de validação" });

    await user.type(newEmail, "creator@postmade.app");
    await user.click(sendCode);
    expect(await screen.findByText("O novo e-mail deve ser diferente do atual.")).toBeInTheDocument();

    await user.clear(newEmail);
    await user.type(newEmail, "novo@postmade.app");
    await user.click(sendCode);

    expect(await screen.findByRole("dialog", { name: "Validar novo e-mail" })).toBeInTheDocument();
    expect(await screen.findByText(/enviamos um código de 6 dígitos para novo@postmade\.app/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Alterar e-mail" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Código de verificação"), "654321");
    await user.click(screen.getByRole("button", { name: "Validar" }));

    expect(toastSuccess).toHaveBeenCalledWith("E-mail alterado com sucesso nesta sessão.");
    expect(store.getState().auth.user?.email).toBe("novo@postmade.app");
    expect(store.getState().auth.user?.id).toBe(originalUserId);
  });

  it("validates and updates the password for email accounts", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Senha atual"), "senha-antiga");
    await user.type(screen.getByLabelText("Nova senha"), "Nova@123");

    expect(screen.getByLabelText("Força da senha")).toHaveAttribute("aria-valuenow", "5");
    await user.click(screen.getByRole("button", { name: "Atualizar senha" }));

    expect(toastSuccess).toHaveBeenCalledWith("Senha alterada com sucesso nesta sessão.");
  });

  it("shows provider-managed notices for Google accounts", () => {
    store.dispatch(setSession({
      name: "Google User",
      email: "google-user@postmade.app",
      identity: { provider: "google", providerSubject: "google-subject-123", emailVerified: true },
    }));
    renderPage();

    expect(screen.getAllByText("Conta gerenciada pelo Google")).toHaveLength(2);
    expect(screen.queryByRole("textbox", { name: "Novo e-mail" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });
});
