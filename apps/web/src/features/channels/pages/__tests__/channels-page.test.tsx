import type { SocialChannel } from "@postmade/types";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import authReducer from "@/features/auth/store/auth-slice";
import workspacesReducer from "@/features/workspaces/store/workspaces-slice";
import { api } from "@/shared/api/api";
import i18n from "@/shared/i18n";

import { ChannelsPage } from "../channels-page";

const { oauthTrigger, oauthUnwrap, toastError, toastSuccess } = vi.hoisted(
  () => ({
    oauthTrigger: vi.fn(),
    oauthUnwrap: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  })
);

vi.mock("../../services/channels-api", () => ({
  useGetOAuthUrlMutation: () => [oauthTrigger],
}));

vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

const initialLanguage = i18n.resolvedLanguage ?? "en";
const owner = { id: "owner-1", name: "Ada", email: "ada@postmade.app" };

function createPageStore({
  channels = [],
  role = "owner",
  configuration = { channels: 15, members: 1 },
  status = "active",
}: {
  channels?: SocialChannel[];
  role?: "owner" | "admin" | "editor" | "viewer";
  configuration?: { channels: number; members: number };
  status?: "trialing" | "active";
} = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      workspaces: workspacesReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
    preloadedState: {
      auth: {
        user: {
          ...owner,
          identity: {
            provider: "password" as const,
            providerSubject: "owner",
            emailVerified: true,
          },
        },
        accounts: [],
      },
      workspaces: {
        activeWorkspaceId: "workspace-1",
        items: [
          {
            id: "workspace-1",
            name: "Postmade",
            ownerId: owner.id,
            subscriptionConfiguration: configuration,
            subscriptionStatus: status,
            trialStartedAt: "2026-01-01T00:00:00.000Z",
            timezone: "America/Sao_Paulo",
            trialEndsAt: "2026-01-16T00:00:00.000Z",
            createdAt: "2026-01-01T00:00:00.000Z",
            members: [{ ...owner, role, joinedAt: "2026-01-01T00:00:00.000Z" }],
            invitations: [],
            resources: {
              channels,
              posts: [],
              selectedCalendarDate: null,
            },
          },
        ],
      },
    },
  });
}

function renderPage(options?: Parameters<typeof createPageStore>[0]) {
  const store = createPageStore(options);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChannelsPage />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

beforeAll(async () => {
  await i18n.changeLanguage("pt-BR");
});

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage);
});

beforeEach(() => {
  oauthTrigger.mockReset();
  oauthUnwrap.mockReset();
  oauthTrigger.mockReturnValue({ unwrap: oauthUnwrap });
  toastError.mockReset();
  toastSuccess.mockReset();
});

describe("ChannelsPage", () => {
  it("shows every supported platform and a useful empty state", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Canais" })
    ).toBeInTheDocument();
    for (const platform of [
      "Facebook",
      "LinkedIn",
      "Instagram",
      "TikTok",
      "YouTube",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name: platform })
      ).toBeInTheDocument();
    }
    expect(screen.getByText("Nenhum canal conectado")).toBeInTheDocument();
    expect(screen.getByText("0 de 15 canais conectados")).toBeInTheDocument();
  });

  it("uses the trial limit and disables connections when it is reached", () => {
    const channels: SocialChannel[] = ["facebook", "linkedin", "instagram"].map(
      (platform, index) => ({
        id: `channel-${index}`,
        platform: platform as SocialChannel["platform"],
        displayName: `Channel ${index}`,
        username: `channel${index}`,
        connected: true,
      })
    );
    renderPage({
      channels,
      configuration: { channels: 500, members: 100 },
      status: "trialing",
    });
    expect(screen.getByText("3 de 3 canais conectados")).toBeInTheDocument();
    expect(screen.getByText("Limite de canais atingido")).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", {
      name: "Conectar conta",
    })) {
      expect(button).toBeDisabled();
    }
  });

  it("uses the plural form for a single channel within a multi-channel limit", () => {
    renderPage({
      channels: [
        {
          id: "facebook-1",
          platform: "facebook",
          displayName: "Postmade",
          username: "postmade",
          connected: true,
        },
      ],
      status: "trialing",
    });
    expect(screen.getByText("1 de 3 canais conectados")).toBeInTheDocument();
    expect(screen.getByText("1 conta conectada")).toBeInTheDocument();
    expect(screen.getByText("1 resultado")).toBeInTheDocument();
  });

  it("shows a high configured channel allowance for an active workspace", () => {
    renderPage({
      configuration: { channels: 500, members: 100 },
      status: "active",
    });
    expect(screen.getByText("0 de 500 canais conectados")).toBeInTheDocument();
  });

  it("keeps editor actions read-only", () => {
    renderPage({ role: "editor" });
    expect(screen.getByText(/somente owners e admins/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Conectar conta" })[0]
    ).toBeDisabled();
  });

  it("requests OAuth for the active workspace and reports API errors", async () => {
    oauthUnwrap.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getAllByRole("button", { name: "Conectar conta" })[0]!
    );
    expect(oauthTrigger).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      platform: "facebook",
    });
    expect(toastError).toHaveBeenCalledWith(
      "Não foi possível iniciar a conexão com Facebook. Tente novamente."
    );
  });

  it("confirms disconnection and removes the channel from its workspace", async () => {
    const user = userEvent.setup();
    const store = renderPage({
      channels: [
        {
          id: "facebook-1",
          platform: "facebook",
          displayName: "Postmade",
          username: "postmade",
          connected: true,
        },
      ],
    });
    await user.click(
      screen.getByRole("button", { name: "Desconectar Postmade" })
    );
    expect(
      screen.getByRole("dialog", { name: "Desconectar canal?" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desconectar canal" }));
    expect(
      store.getState().workspaces.items[0]!.resources.channels
    ).toHaveLength(0);
    expect(screen.getByText("Nenhum canal conectado")).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith("Postmade foi desconectado.");
  });

  it("paginates connected channels and changes the number of results per page", async () => {
    const user = userEvent.setup();
    const channels: SocialChannel[] = Array.from(
      { length: 26 },
      (_, index) => ({
        id: `channel-${index}`,
        platform: "instagram",
        displayName: `Channel ${index + 1}`,
        username: `@channel${index + 1}`,
        connected: true,
      })
    );
    renderPage({ channels, configuration: { channels: 500, members: 100 } });

    expect(screen.getByText("26 resultados")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(11);
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Channel 11")).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", { name: "Resultados por página" })
    );
    await user.click(screen.getByRole("option", { name: "25" }));
    expect(screen.getAllByRole("row")).toHaveLength(26);
    expect(screen.getByText("Channel 1")).toBeInTheDocument();
  });

  it("filters connected channels by account and social network", async () => {
    const user = userEvent.setup();
    renderPage({
      channels: [
        {
          id: "facebook-1",
          platform: "facebook",
          displayName: "Alpha Studio",
          username: "@alpha",
          connected: true,
        },
        {
          id: "youtube-1",
          platform: "youtube",
          displayName: "Beta Videos",
          username: "@beta",
          connected: true,
        },
      ],
    });

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar canais conectados" }),
      "beta"
    );
    expect(screen.getByText("Beta Videos")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Studio")).not.toBeInTheDocument();
    expect(screen.getByText("1 resultado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await user.click(
      screen.getByRole("combobox", { name: "Filtrar por rede social" })
    );
    await user.click(screen.getByRole("option", { name: "Facebook" }));
    expect(screen.getByText("Alpha Studio")).toBeInTheDocument();
    expect(screen.queryByText("Beta Videos")).not.toBeInTheDocument();
  });
});
