import type { RouteObject } from "react-router-dom";
import { AccountPage } from "@/features/account";
import { CalendarPage } from "@/features/calendar";
import { ChannelsPage } from "@/features/channels";
import { PostsPage } from "@/features/posts";
import { SubscriptionPage } from "@/features/subscription";
import { DashboardHome } from "@/shared/components/dashboard-home";
import { WorkspaceSettingsPage } from "@/features/workspaces";
import { AppShell } from "@/shared/layouts/app-shell";
import { ROUTES } from "./route-paths";

// This route group defines the authenticated application surface. A real
// session guard will wrap this group when backend authentication is available.
export const protectedRoutes: RouteObject = {
  element: <AppShell />,
  children: [
    { path: ROUTES.dashboard, element: <DashboardHome /> },
    { path: ROUTES.posts, element: <PostsPage /> },
    { path: ROUTES.workspaceChannels, element: <ChannelsPage /> },
    { path: ROUTES.calendar, element: <CalendarPage /> },
    { path: ROUTES.workspaceSettings, element: <WorkspaceSettingsPage /> },
    { path: ROUTES.account, element: <AccountPage /> },
    { path: ROUTES.workspaceSubscription, element: <SubscriptionPage /> },
  ],
};
