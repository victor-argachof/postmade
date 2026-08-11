import type { TagGroup } from "@postmade/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";

import { TagInput } from "../tag-input";

export function TagGroupModal({
  existingNames,
  group,
  onClose,
  onSubmit,
  open,
}: {
  existingNames: string[];
  group: TagGroup | null;
  onClose: () => void;
  onSubmit: (value: { name: string; tags: string[] }) => void;
  open: boolean;
}) {
  const { t } = useTranslation("tags");
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (open) {
      setName(group?.name ?? "");
      setTags(group?.tags ?? []);
      setSubmitted(false);
    }
  }, [group, open]);
  const duplicate = existingNames.some(
    (item) =>
      item.toLocaleLowerCase() === name.trim().toLocaleLowerCase() &&
      item.toLocaleLowerCase() !== group?.name.toLocaleLowerCase()
  );
  const nameError =
    submitted && !name.trim()
      ? t("modal.nameRequired")
      : duplicate
        ? t("modal.duplicate")
        : undefined;
  const tagsError =
    submitted && !tags.length ? t("modal.tagsRequired") : undefined;
  const valid = Boolean(name.trim() && tags.length && !duplicate);
  return (
    <Modal
      closeLabel={t("modal.close")}
      onClose={onClose}
      open={open}
      title={t(group ? "modal.editTitle" : "modal.createTitle")}
    >
      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (valid) onSubmit({ name: name.trim(), tags });
        }}
      >
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="tag-group-name"
          >
            {t("modal.name")}
          </label>
          <Input
            aria-describedby={nameError ? "tag-group-name-error" : undefined}
            aria-invalid={Boolean(nameError)}
            autoFocus
            className={
              nameError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                : undefined
            }
            id="tag-group-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {nameError && (
            <p
              className="mt-2 text-xs text-red-600"
              id="tag-group-name-error"
              role="alert"
            >
              {nameError}
            </p>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">{t("modal.tags")}</p>
          <TagInput error={tagsError} value={tags} onChange={setTags} />
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("modal.cancel")}
          </Button>
          <Button type="submit">
            {t(group ? "modal.save" : "modal.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
