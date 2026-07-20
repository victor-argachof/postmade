import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/store/auth-slice";
import calendarReducer from "@/features/calendar/store/calendar-slice";
import channelsReducer from "@/features/channels/store/channels-slice";
import postsReducer from "@/features/posts/store/posts-slice";
import { api } from "@/shared/api/api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    calendar: calendarReducer,
    channels: channelsReducer,
    posts: postsReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
