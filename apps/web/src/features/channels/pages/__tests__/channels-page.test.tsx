import type {
  ChannelsPage as ChannelsPageResponse,
  SocialChannel,
} from "@postmade/types";
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

const mocks = vi.hoisted(() => ({
  data: undefined as ChannelsPageResponse | undefined,
  disconnect: vi.fn(),
  disconnectUnwrap: vi.fn(),
  start: vi.fn(),
  startUnwrap: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../services/channels-api", () => ({
  useGetChannelsQuery: () => ({
    data: mocks.data,
    error: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useStartChannelOAuthMutation: () => [mocks.start],
  useDisconnectChannelMutation: () => [mocks.disconnect, { isLoading: false }],
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

const owner = { id: "owner-1", name: "Ada", email: "ada@postmade.app" };
const now = "2026-01-01T00:00:00.000Z";
const initialLanguage = i18n.resolvedLanguage ?? "en";

beforeAll(async () => {
  await i18n.changeLanguage("pt-BR");
});

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage);
});

function channel(overrides: Partial<SocialChannel> = {}): SocialChannel {
  return {
    id: "facebook-1",
    workspaceId: "workspace-1",
    platform: "facebook",
    displayName: "Postmade",
    username: "@postmade",
    avatarUrl: null,
    connectionStatus: "connected",
    lastCheckedAt: null,
    connectedAt: now,
    disconnectedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function page(items: SocialChannel[] = []): ChannelsPageResponse {
  const byPlatform = {
    facebook: 0,
    linkedin: 0,
    instagram: 0,
    tiktok: 0,
    youtube: 0,
  };
  for (const item of items) byPlatform[item.platform] += 1;
  return {
    items,
    page: 1,
    pageSize: 10,
    total: items.length,
    totalPages: Math.ceil(items.length / 10),
    summary: { total: items.length, byPlatform },
  };
}

function renderPage(role: "owner" | "admin" | "editor" | "viewer" = "owner") {
  const store = configureStore({
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
            providerSubject: owner.id,
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
            role,
            subscriptionConfiguration: { channels: 15, members: 1 },
            subscriptionStatus: "active" as const,
            trialStartedAt: now,
            trialEndsAt: now,
            createdAt: now,
            timezone: "America/Sao_Paulo",
            members: [{ ...owner, role, joinedAt: now }],
            invitations: [],
            resources: { posts: [], selectedCalendarDate: null },
          },
        ],
      },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ChannelsPage />
      </MemoryRouter>
    </Provider>
  );
}

beforeEach(() => {
  mocks.data = page();
  mocks.start.mockReset();
  mocks.startUnwrap.mockReset();
  mocks.start.mockReturnValue({ unwrap: mocks.startUnwrap });
  mocks.disconnect.mockReset();
  mocks.disconnectUnwrap.mockReset();
  mocks.disconnect.mockReturnValue({ unwrap: mocks.disconnectUnwrap });
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("ChannelsPage", () => {
  it("renders channels returned by the API", () => {
    mocks.data = page([channel()]);
    renderPage();
    expect(screen.getByText("Postmade")).toBeInTheDocument();
    expect(screen.getByText("1 de 15 canais conectados")).toBeInTheDocument();
  });

  it("keeps editors read-only", () => {
    renderPage("editor");
    expect(
      screen.getByText(/somente proprietários e administradores/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Conectar conta" })[0]
    ).toBeDisabled();
  });

  it("starts OAuth for the active workspace and translates API errors", async () => {
    mocks.startUnwrap.mockRejectedValue({
      data: {
        statusCode: 409,
        code: "CHANNEL_PROVIDER_UNAVAILABLE",
        message: "Unavailable",
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getAllByRole("button", { name: "Conectar conta" })[0]!
    );
    expect(mocks.start).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      platform: "facebook",
    });
    expect(mocks.toastError).toHaveBeenCalled();
  });

  it("disconnects only after confirmation", async () => {
    mocks.data = page([channel()]);
    mocks.disconnectUnwrap.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("button", { name: "Desconectar Postmade" })
    );
    await user.click(screen.getByRole("button", { name: "Desconectar canal" }));
    expect(mocks.disconnect).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      channelId: "facebook-1",
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });
});
