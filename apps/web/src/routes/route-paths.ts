export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  termsOfUse: "/terms-of-use",
  privacyPolicy: "/privacy-policy",
  dashboard: "/dashboard",
  posts: "/posts",
  workspaceChannels: "/workspace/channels",
  calendar: "/calendar",
  workspaceSettings: "/workspace/settings",
  workspaceMembers: "/workspace/settings#workspace-members",
  account: "/account",
  workspaceSubscription: "/workspace/subscription",
  workspaceSubscriptionConfigurator: "/workspace/subscription#subscription-configurator",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
