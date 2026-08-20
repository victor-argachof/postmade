import type { RouteObject } from "react-router-dom";

import { AccountPage } from "@/features/account";
import { ChannelsPage } from "@/features/channels";
import { PostComposerPage } from "@/features/create-post";
import { DashboardPage } from "@/features/dashboard";
import { CalendarPage, PostsPage } from "@/features/posts";
import { SubscriptionPage } from "@/features/subscription";
import { TagsPage } from "@/features/tags";
import { WorkspaceSettingsPage } from "@/features/workspaces";

import { AuthenticatedShell } from "./authenticated-shell";
import { ROUTES } from "./route-paths";

// This route group defines the authenticated application surface. A real
// session guard will wrap this group when backend authentication is available.
export const protectedRoutes: RouteObject = {
  element: <AuthenticatedShell />,
  children: [
    { path: ROUTES.dashboard, element: <DashboardPage /> },
    { path: ROUTES.posts, element: <PostsPage /> },
    { path: ROUTES.postsCalendar, element: <CalendarPage /> },
    { path: ROUTES.newPost, element: <PostComposerPage /> },
    { path: "/posts/:publicationId/edit", element: <PostComposerPage /> },
    { path: ROUTES.workspaceChannels, element: <ChannelsPage /> },
    { path: ROUTES.tags, element: <TagsPage /> },
    { path: ROUTES.workspaceSettings, element: <WorkspaceSettingsPage /> },
    { path: ROUTES.account, element: <AccountPage /> },
    { path: ROUTES.workspaceSubscription, element: <SubscriptionPage /> },
  ],
};
