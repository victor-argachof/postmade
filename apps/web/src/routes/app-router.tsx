import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { protectedRoutes } from "./protected-routes";
import { publicRoutes } from "./public-routes";
import { ROUTES } from "./route-paths";

const routes: RouteObject[] = [
  ...publicRoutes,
  protectedRoutes,
  { path: ROUTES.home, element: <Navigate to={ROUTES.dashboard} replace /> },
  { path: "*", element: <Navigate to={ROUTES.dashboard} replace /> },
];

export function AppRouter() {
  return useRoutes(routes);
}
