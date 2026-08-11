import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { isValidTag, normalizeTag, normalizeTags } from "../lib/tags";

export function TagInput({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (tags: string[]) => void;
  value: string[];
}) {
  const { t } = useTranslation("tags");
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const commit = (raw: string) => {
    const candidates = raw.split(/[\s,]+/).filter(Boolean);
    if (!candidates.length) return;
    if (candidates.some((candidate) => !isValidTag(candidate))) {
      setInvalid(true);
      return;
    }
    onChange(normalizeTags([...value, ...candidates]));
    setDraft("");
    setInvalid(false);
  };
  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        {value.map((tag) => (
          <span
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-sm font-semibold text-primary"
            key={tag.toLocaleLowerCase()}
          >
            #{tag}
            <button
              aria-label={t("input.remove", { tag })}
              className="cursor-pointer rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              disabled={disabled}
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-label={t("input.label")}
          className="h-7 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={disabled}
          placeholder={value.length ? "" : t("input.placeholder")}
          value={draft}
          onBlur={() => {
            if (draft.trim()) commit(draft);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (["Enter", ",", " "].includes(event.key)) {
              event.preventDefault();
              commit(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (/[\s,]/.test(pasted)) {
              event.preventDefault();
              commit(pasted);
            }
          }}
        />
      </div>
      {invalid && (
        <p className="text-destructive mt-2 text-xs font-semibold">
          {t("input.invalid")}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{t("input.hint")}</p>
    </div>
  );
}
