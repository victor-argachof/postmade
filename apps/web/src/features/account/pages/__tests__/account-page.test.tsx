import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import {
  clearKnownAccounts,
  setSession,
} from "@/features/auth/store/auth-slice";
import {
  createActiveWorkspaceMock,
  createInitialWorkspace,
} from "@/features/workspaces/store/workspaces-slice";
import i18n from "@/shared/i18n";
import { store } from "@/shared/store";

import { AccountPage } from "../account-page";

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
  store.dispatch(
    setSession({
      name: "User Example",
      email: "user@postmade.app",
      identity: { provider: "password", emailVerified: true },
    })
  );
});

function mockDeletionApi(impact: object, deleteStatus = 204) {
  const NativeRequest = globalThis.Request;
  vi.stubGlobal(
    "Request",
    class extends NativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(
          typeof input === "string" && input.startsWith("/")
            ? new URL(input, window.location.origin)
            : input,
          init
        );
      }
    }
  );
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url =
      input instanceof Request
        ? new URL(input.url)
        : new URL(String(input), window.location.origin);
    if (url.pathname.endsWith("/account/deletion-impact")) {
      return new Response(JSON.stringify(impact), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname.endsWith("/account")) {
      return new Response(deleteStatus === 204 ? null : "{}", {
        status: deleteStatus,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("{}", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </Provider>
  );
}

describe("AccountPage", () => {
  it("validates and saves profile changes", async () => {
    const user = userEvent.setup();
    renderPage();

    const name = screen.getByRole("textbox", { name: "Nome completo" });
    const saveButton = screen.getByRole("button", {
      name: "Salvar alterações",
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Minha conta" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "E-mail" })
    ).not.toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await user.clear(name);
    await user.tab();
    expect(
      await screen.findByText("Informe seu nome completo.")
    ).toBeInTheDocument();

    await user.type(name, "Ada");
    expect(
      await screen.findByText("Informe nome e sobrenome.")
    ).toBeInTheDocument();

    await user.type(name, " Lovelace");
    expect(
      screen.queryByText("Informe nome e sobrenome.")
    ).not.toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    expect(toastSuccess).toHaveBeenCalledWith(
      "Alterações salvas nesta sessão."
    );
    expect(saveButton).toBeDisabled();
  });

  it("changes the email only after code verification", async () => {
    const user = userEvent.setup();
    const originalUserId = store.getState().auth.user?.id;
    renderPage();

    const newEmail = screen.getByRole("textbox", { name: "Novo e-mail" });
    const sendCode = screen.getByRole("button", {
      name: "Enviar código de validação",
    });

    await user.type(newEmail, "user@postmade.app");
    await user.click(sendCode);
    expect(
      await screen.findByText("O novo e-mail deve ser diferente do atual.")
    ).toBeInTheDocument();

    await user.clear(newEmail);
    await user.type(newEmail, "novo@postmade.app");
    await user.click(sendCode);

    expect(
      await screen.findByRole("dialog", { name: "Validar novo e-mail" })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /enviamos um código de 6 dígitos para novo@postmade\.app/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Alterar e-mail" })
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Código de verificação"), "654321");
    await user.click(screen.getByRole("button", { name: "Validar" }));

    expect(toastSuccess).toHaveBeenCalledWith(
      "E-mail alterado com sucesso nesta sessão."
    );
    expect(store.getState().auth.user?.email).toBe("novo@postmade.app");
    expect(store.getState().auth.user?.id).toBe(originalUserId);
  });

  it("validates and updates the password for email accounts", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Senha atual"), "senha-antiga");
    await user.type(screen.getByLabelText("Nova senha"), "Nova@123");

    expect(screen.getByLabelText("Força da senha")).toHaveAttribute(
      "aria-valuenow",
      "5"
    );
    await user.click(screen.getByRole("button", { name: "Atualizar senha" }));

    expect(toastSuccess).toHaveBeenCalledWith(
      "Senha alterada com sucesso nesta sessão."
    );
  });

  it("shows provider-managed notices for Google accounts", () => {
    store.dispatch(
      setSession({
        name: "Google User",
        email: "google-user@postmade.app",
        identity: {
          provider: "google",
          providerSubject: "google-subject-123",
          emailVerified: true,
        },
      })
    );
    renderPage();

    expect(screen.getAllByText("Conta gerenciada pelo Google")).toHaveLength(2);
    expect(
      screen.queryByRole("textbox", { name: "Novo e-mail" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });

  it("blocks deletion while an owned workspace has an active subscription", async () => {
    const user = userEvent.setup();
    const account = store.getState().auth.user!;
    store.dispatch(
      createActiveWorkspaceMock({
        userId: account.id,
        userName: account.name,
        userEmail: account.email,
      })
    );
    const workspace = store
      .getState()
      .workspaces.items.find((item) => item.ownerId === account.id)!;
    mockDeletionApi({
      ownedWorkspaces: [
        {
          id: workspace.id,
          name: workspace.name,
          memberCount: workspace.members.length,
          subscriptionStatus: "active",
          cancelAtPeriodEnd: false,
          currentPeriodEndsAt: workspace.billing?.currentPeriodEndsAt ?? null,
        },
      ],
      externalWorkspaces: [],
      blocked: true,
      availableAt: workspace.billing?.currentPeriodEndsAt ?? null,
    });
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Excluir minha conta" })
    );

    expect(await screen.findByText("Ação necessária")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sua assinatura ainda está ativa, efetue o cancelamento para continuar com a exclusão da conta."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Cancelar assinatura/ })
    ).toBeInTheDocument();
  });

  it("allows deletion when an active subscription is already canceling", async () => {
    const user = userEvent.setup();
    mockDeletionApi({
      ownedWorkspaces: [
        {
          id: "canceling-workspace",
          name: "Workspace cancelando",
          memberCount: 1,
          subscriptionStatus: "active",
          cancelAtPeriodEnd: true,
          currentPeriodEndsAt: "2026-09-11T12:00:00.000Z",
        },
      ],
      externalWorkspaces: [],
      blocked: false,
      availableAt: null,
    });
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Excluir minha conta" })
    );

    expect(
      await screen.findByText("Cancelamento agendado")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /acesso será encerrado imediatamente e o período restante não será reembolsado/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("gives specific guidance for an overdue subscription", async () => {
    const user = userEvent.setup();
    mockDeletionApi({
      ownedWorkspaces: [
        {
          id: "past-due-workspace",
          name: "Workspace pendente",
          memberCount: 1,
          subscriptionStatus: "past_due",
          cancelAtPeriodEnd: false,
          currentPeriodEndsAt: null,
        },
      ],
      externalWorkspaces: [],
      blocked: true,
      availableAt: null,
    });
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Excluir minha conta" })
    );

    expect(await screen.findByText("Ação necessária")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Identificamos uma pendência de pagamento na sua assinatura. Regularize a cobrança para continuar com a exclusão da conta."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Regularizar pagamento/ })
    ).toBeInTheDocument();
  });

  it("collects feedback, reauthenticates, and deletes an eligible account", async () => {
    const user = userEvent.setup();
    const account = store.getState().auth.user!;
    store.dispatch(
      createInitialWorkspace({
        userId: account.id,
        userName: account.name,
        userEmail: account.email,
      })
    );
    const workspace = store
      .getState()
      .workspaces.items.find((item) => item.ownerId === account.id)!;
    const fetchMock = mockDeletionApi({
      ownedWorkspaces: [
        {
          id: workspace.id,
          name: workspace.name,
          memberCount: 1,
          subscriptionStatus: "trialing",
          cancelAtPeriodEnd: false,
          currentPeriodEndsAt: null,
        },
      ],
      externalWorkspaces: [],
      blocked: false,
      availableAt: null,
    });
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Excluir minha conta" })
    );
    await user.click(await screen.findByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("radio", { name: "Outro motivo" }));
    const continueButton = screen.getByRole("button", { name: "Continuar" });
    expect(continueButton).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "Descreva o outro motivo" }),
      "Quero reorganizar minhas ferramentas."
    );
    await user.click(continueButton);
    await user.type(
      screen.getByRole("textbox", { name: /Digite EXCLUIR/ }),
      "EXCLUIR"
    );
    await user.type(screen.getByLabelText("Digite sua senha atual"), "secret");
    await user.click(
      screen.getByRole("button", { name: "Excluir permanentemente" })
    );

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "Sua conta foi excluída permanentemente."
      )
    );
    expect(store.getState().auth.user).toBeNull();
    expect(
      store.getState().workspaces.items.some((item) => item.id === workspace.id)
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalled();
  });
});
