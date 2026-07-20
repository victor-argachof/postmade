import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: { name: string; email: string } | null;
}

const initialState: AuthState = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
    },
    clearSession: (state) => {
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
