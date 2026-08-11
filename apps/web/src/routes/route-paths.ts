export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  termsOfUse: "/terms-of-use",
  privacyPolicy: "/privacy-policy",
  dashboard: "/dashboard",
  posts: "/posts",
  newPost: "/posts/new",
  editPost: (publicationId: string) => `/posts/${publicationId}/edit`,
  workspaceChannels: "/workspace/channels",
  calendar: "/calendar",
  tags: "/tags",
  workspaceSettings: "/workspace/settings",
  workspaceMembers: "/workspace/settings#workspace-members",
  account: "/account",
  workspaceSubscription: "/workspace/subscription",
  workspaceSubscriptionConfigurator:
    "/workspace/subscription#subscription-configurator",
} as const;

export type AppRoute = Exclude<
  (typeof ROUTES)[keyof typeof ROUTES],
  (...args: never[]) => string
>;
