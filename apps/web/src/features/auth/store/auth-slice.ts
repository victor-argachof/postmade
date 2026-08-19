import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type AuthProvider = "password" | "google";

export type AuthIdentity = {
  provider: AuthProvider;
  providerSubject: string;
  emailVerified: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  identity: AuthIdentity;
};

type SessionInput = Omit<AuthUser, "id" | "identity"> & {
  id?: string;
  identity: Omit<AuthIdentity, "providerSubject"> & {
    providerSubject?: string;
  };
};

interface AuthState {
  user: AuthUser | null;
  accounts: AuthUser[];
}

const initialState: AuthState = { user: null, accounts: [] };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: {
      reducer: (state, action: PayloadAction<AuthUser>) => {
        state.user = action.payload;
        const accountIndex = state.accounts.findIndex(
          (account) => account.id === action.payload.id
        );
        if (accountIndex >= 0) state.accounts[accountIndex] = action.payload;
        else state.accounts.push(action.payload);
      },
      prepare: (input: SessionInput) => ({
        payload: {
          ...input,
          id: input.id ?? `user_${nanoid()}`,
          email: input.email.trim().toLowerCase(),
          identity: {
            ...input.identity,
            providerSubject:
              input.identity.providerSubject ??
              `${input.identity.provider}:${nanoid()}`,
          },
        } satisfies AuthUser,
      }),
    },
    updateProfile: (
      state,
      action: PayloadAction<{ name?: string; email?: string }>
    ) => {
      if (!state.user) return;
      if (action.payload.name) state.user.name = action.payload.name;
      if (action.payload.email)
        state.user.email = action.payload.email.trim().toLowerCase();
      const account = state.accounts.find((item) => item.id === state.user?.id);
      if (account) Object.assign(account, state.user);
    },
    clearSession: (state) => {
      state.user = null;
    },
    clearKnownAccounts: (state) => {
      state.user = null;
      state.accounts = [];
    },
    deleteAccount: (state, action: PayloadAction<{ userId: string }>) => {
      state.accounts = state.accounts.filter(
        (account) => account.id !== action.payload.userId
      );
      if (state.user?.id === action.payload.userId) state.user = null;
    },
  },
});

export const {
  setSession,
  updateProfile,
  clearSession,
  clearKnownAccounts,
  deleteAccount,
} = authSlice.actions;
export default authSlice.reducer;
