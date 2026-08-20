import { Navigate } from "react-router-dom";

import { useAppSelector } from "@/shared/hooks/store-hooks";
import { AppShell } from "@/shared/layouts/app-shell";

import { ROUTES } from "./route-paths";

export function AuthenticatedShell() {
  const user = useAppSelector((state) => state.auth.user);
  return user ? <AppShell /> : <Navigate to={ROUTES.login} replace />;
}
