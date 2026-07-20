import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { setSession } from "@/features/auth/store/auth-slice";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

export function ProfileForm() {
  const { t } = useTranslation("account");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [name, setName] = useState(user?.name ?? t("fallbackName"));
  const [saved, setSaved] = useState(false);
  const email = user?.email ?? "creator@postmade.app";

  useEffect(() => {
    setName(user?.name ?? t("fallbackName"));
  }, [t, user?.name]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(setSession({ name: name.trim(), email }));
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <label className="block text-sm font-medium">
        {t("name")}
        <Input
          className="mt-2"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          required
        />
      </label>
      <div>
        <label className="block text-sm font-medium">
          {t("email")}
          <Input
            className="mt-2"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            readOnly
            aria-describedby="account-email-helper"
          />
        </label>
        <p id="account-email-helper" className="mt-2 text-xs leading-5 text-muted-foreground">
          {t("emailHelper")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit" disabled={!name.trim()}>{t("save")}</Button>
        {saved && (
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground" role="status">
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            {t("saveSuccess")}
          </p>
        )}
      </div>
    </form>
  );
}
