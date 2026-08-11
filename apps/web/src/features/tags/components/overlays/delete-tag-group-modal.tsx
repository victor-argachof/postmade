import type { TagGroup } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

export function DeleteTagGroupModal({
  group,
  onClose,
  onConfirm,
}: {
  group: TagGroup | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("tags");
  return (
    <Modal
      closeLabel={t("deleteModal.close")}
      onClose={onClose}
      open={Boolean(group)}
      title={t("deleteModal.title")}
    >
      {group && (
        <>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("deleteModal.description", { name: group.name })}
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("deleteModal.cancel")}
            </Button>
            <Button type="button" onClick={onConfirm}>
              {t("deleteModal.confirm")}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
