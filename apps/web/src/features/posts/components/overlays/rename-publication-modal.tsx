import type { ScheduledPublication } from "@postmade/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

export function RenamePublicationModal({
  isLoading,
  publication,
  onClose,
  onConfirm,
}: {
  isLoading: boolean;
  publication: ScheduledPublication | null;
  onClose: () => void;
  onConfirm: (title: string | null) => Promise<void>;
}) {
  const { t } = useTranslation("posts");
  const [title, setTitle] = useState(publication?.title ?? "");

  return (
    <Modal
      closeLabel={t("renameModal.close")}
      onClose={onClose}
      open={Boolean(publication)}
      title={t("renameModal.title")}
    >
      {publication && (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const normalizedTitle = title.trim();
            void onConfirm(normalizedTitle || null);
          }}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            {t("renameModal.description")}
          </p>
          <div className="mt-5 flex justify-between gap-4">
            <label
              className="text-sm font-semibold"
              htmlFor="publication-title"
            >
              {t("renameModal.label")}
            </label>
            <span className="text-xs text-muted-foreground">
              {title.length}/120
            </span>
          </div>
          <input
            autoFocus
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            disabled={isLoading}
            id="publication-title"
            maxLength={120}
            placeholder={t("renameModal.placeholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={isLoading}
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {t("renameModal.cancel")}
            </Button>
            <Button disabled={isLoading} type="submit">
              {isLoading ? t("renameModal.saving") : t("renameModal.confirm")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
