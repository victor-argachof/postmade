import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/features/auth/store/auth-slice";
import calendarReducer from "@/features/posts/store/calendar-slice";
import postsReducer from "@/features/posts/store/posts-slice";
import workspacesReducer from "@/features/workspaces/store/workspaces-slice";
import { api } from "@/shared/api/api";

for (const key of [
  "postmade.auth-session.v1",
  "postmade.workspaces.v1",
  "postmade.workspaces.v2",
  "postmade.workspaces.v3",
  "postmade.workspaces.v4",
])
  window.localStorage.removeItem(key);
export const store = configureStore({
  reducer: {
    auth: authReducer,
    calendar: calendarReducer,
    posts: postsReducer,
    workspaces: workspacesReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
