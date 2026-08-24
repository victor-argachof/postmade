import type { RouteObject } from "react-router-dom";

import { ForgotPasswordPage, LoginPage, RegisterPage } from "@/features/auth";
import { WorkspaceInvitationPage } from "@/features/workspaces";

import { ROUTES } from "./route-paths";

export const publicRoutes: RouteObject[] = [
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.register, element: <RegisterPage /> },
  { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
  { path: ROUTES.invitation, element: <WorkspaceInvitationPage /> },
];
