import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type PasswordRequirementKey =
  "minLength" | "uppercase" | "lowercase" | "number" | "specialCharacter";

function getPasswordRequirements(
  password: string
): Array<{ key: PasswordRequirementKey; isMet: boolean }> {
  return [
    { key: "minLength", isMet: password.length >= 8 },
    { key: "uppercase", isMet: /[A-Z]/.test(password) },
    { key: "lowercase", isMet: /[a-z]/.test(password) },
    { key: "number", isMet: /\d/.test(password) },
    { key: "specialCharacter", isMet: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function PasswordStrength({
  password,
  idPrefix = "password",
}: {
  password: string;
  idPrefix?: string;
}) {
  const { t } = useTranslation("auth");
  const requirements = getPasswordRequirements(password);
  const strength = requirements.filter(({ isMet }) => isMet).length;
  const strengthLabel =
    strength <= 1
      ? "passwordStrengthWeak"
      : strength <= 3
        ? "passwordStrengthMedium"
        : strength === 4
          ? "passwordStrengthGood"
          : "passwordStrengthStrong";

  return (
    <>
      <div aria-live="polite" id={`${idPrefix}-strength`}>
        <div className="mb-2 flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">{t("passwordStrength")}</span>
          <span
            className={
              strength === requirements.length
                ? "font-semibold text-emerald-700 dark:text-emerald-400"
                : ""
            }
          >
            {t(strengthLabel)}
          </span>
        </div>
        <div
          className="grid grid-cols-5 gap-1"
          role="progressbar"
          aria-label={t("passwordStrength")}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={strength}
        >
          {requirements.map(({ key }, index) => (
            <span
              className={`h-1.5 rounded-full transition-all ${index < strength ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" : "bg-muted"}`}
              key={key}
            />
          ))}
        </div>
      </div>

      <ul
        className="grid gap-2 text-xs sm:grid-cols-2"
        id={`${idPrefix}-requirements`}
      >
        {requirements.map(({ key, isMet }) => (
          <li
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all ${isMet ? "border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400" : "border-transparent text-muted-foreground"}`}
            key={key}
          >
            {isMet ? (
              <Check
                aria-hidden="true"
                className="size-3.5 stroke-[3] text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <X aria-hidden="true" className="size-3.5" />
            )}
            {t(`passwordRequirements.${key}`)}
          </li>
        ))}
      </ul>
    </>
  );
}
