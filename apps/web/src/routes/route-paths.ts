export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  termsOfUse: "/terms-of-use",
  privacyPolicy: "/privacy-policy",
  dashboard: "/dashboard",
  posts: "/posts",
  channels: "/channels",
  calendar: "/calendar",
  account: "/account",
  subscription: "/subscription",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
