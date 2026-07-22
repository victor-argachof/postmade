import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthProvider = "email" | "google";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
};

type SessionPayload = Omit<AuthUser, "provider" | "id"> & {
  provider?: AuthProvider;
  preserveId?: boolean;
};

interface AuthState {
  user: AuthUser | null;
}

const initialState: AuthState = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionPayload>) => {
      const { preserveId, provider, ...profile } = action.payload;
      state.user = {
        ...profile,
        id: state.user && (preserveId || state.user.email === action.payload.email)
          ? state.user.id
          : `user:${action.payload.email.trim().toLowerCase()}`,
        provider: provider ?? state.user?.provider ?? "email",
      };
    },
    clearSession: (state) => {
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
