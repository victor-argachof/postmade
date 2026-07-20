import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/route-paths";
import { useAppDispatch } from "@/shared/hooks/store-hooks";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { setSession } from "../store/auth-slice";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useTranslation("auth");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const isRegister = mode === "register";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(setSession({ name: "Creator", email }));
    navigate(ROUTES.dashboard);
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      {isRegister && (
        <label className="block text-sm font-medium">
          {t("name")}
          <Input className="mt-2" name="name" autoComplete="name" required />
        </label>
      )}
      <label className="block text-sm font-medium">
        {t("email")}
        <Input className="mt-2" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="block text-sm font-medium">
        {t("password")}
        <Input className="mt-2" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} required />
      </label>
      <Button className="w-full" type="submit">
        {t(isRegister ? "register" : "login")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t(isRegister ? "hasAccount" : "noAccount")} {" "}
        <Link className="font-semibold text-primary hover:underline" to={isRegister ? ROUTES.login : ROUTES.register}>
          {t(isRegister ? "login" : "register")}
        </Link>
      </p>
    </form>
  );
}
