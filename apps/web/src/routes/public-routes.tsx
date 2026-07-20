import type { RouteObject } from "react-router-dom";
import { LoginPage, RegisterPage } from "@/features/auth";
import { ROUTES } from "./route-paths";

export const publicRoutes: RouteObject[] = [
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.register, element: <RegisterPage /> },
];
