import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/store/auth-slice";
import calendarReducer from "@/features/calendar/store/calendar-slice";
import channelsReducer from "@/features/channels/store/channels-slice";
import postsReducer from "@/features/posts/store/posts-slice";
import workspacesReducer from "@/features/workspaces/store/workspaces-slice";
import { api } from "@/shared/api/api";

const WORKSPACES_STORAGE_KEY = "postmade.workspaces.v1";
const AUTH_STORAGE_KEY = "postmade.auth-session.v1";

function loadPersistedAuth() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as ReturnType<typeof authReducer>;
    const user = parsed?.user;
    const isValidUser = (value: typeof user) => Boolean(
      value
      && typeof value.id === "string"
      && typeof value.name === "string"
      && typeof value.email === "string"
      && value.identity
      && typeof value.identity.providerSubject === "string",
    );
    if (
      !parsed
      || !Array.isArray(parsed.accounts)
      || parsed.accounts.some((account) => !isValidUser(account))
      || (user !== null && !isValidUser(user))
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function loadPersistedWorkspaces() {
  try {
    const raw = window.localStorage.getItem(WORKSPACES_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("items" in parsed) || !Array.isArray(parsed.items)) return undefined;
    const persisted = parsed as ReturnType<typeof workspacesReducer>;
    return {
      ...persisted,
      items: persisted.items.map((workspace) => workspace.subscriptionStatus === "trialing"
        ? { ...workspace, plan: "pro" as const }
        : workspace),
    };
  } catch {
    return undefined;
  }
}

const persistedWorkspaces = loadPersistedWorkspaces();
const persistedAuth = loadPersistedAuth();
const initialAuthState = authReducer(undefined, { type: "@@INIT" });
const initialWorkspacesState = workspacesReducer(undefined, { type: "@@INIT" });

export const store = configureStore({
  reducer: {
    auth: authReducer,
    calendar: calendarReducer,
    channels: channelsReducer,
    posts: postsReducer,
    workspaces: workspacesReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
  preloadedState: {
    auth: persistedAuth ?? initialAuthState,
    workspaces: persistedWorkspaces ?? initialWorkspacesState,
  },
});

store.subscribe(() => {
  const state = store.getState();
  window.localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(state.workspaces));
  if (state.auth.user || state.auth.accounts.length > 0) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.auth));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
