import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthProvider = "email" | "google";

export type AuthUser = {
  name: string;
  email: string;
  provider: AuthProvider;
};

type SessionPayload = Omit<AuthUser, "provider"> & { provider?: AuthProvider };

interface AuthState {
  user: AuthUser | null;
}

const initialState: AuthState = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionPayload>) => {
      state.user = {
        ...action.payload,
        provider: action.payload.provider ?? state.user?.provider ?? "email",
      };
    },
    clearSession: (state) => {
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
