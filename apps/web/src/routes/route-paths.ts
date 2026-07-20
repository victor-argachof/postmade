export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  posts: "/posts",
  channels: "/channels",
  calendar: "/calendar",
  account: "/account",
  subscription: "/subscription",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
