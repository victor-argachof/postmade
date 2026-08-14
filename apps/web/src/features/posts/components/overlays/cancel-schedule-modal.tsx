import type { ScheduledPublication } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

export function CancelScheduleModal({
  publication,
  onClose,
  onConfirm,
}: {
  publication: ScheduledPublication | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("posts");
  return (
    <Modal
      closeLabel={t("cancelModal.close")}
      onClose={onClose}
      open={Boolean(publication)}
      title={t("cancelModal.title")}
    >
      {publication && (
        <>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("cancelModal.description")}
          </p>
          <p className="mt-4 line-clamp-2 rounded-xl bg-muted p-3 text-sm font-semibold">
            {publication.content || t("mediaOnly")}
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancelModal.cancel")}
            </Button>
            <Button type="button" onClick={onConfirm}>
              {t("cancelModal.confirm")}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
