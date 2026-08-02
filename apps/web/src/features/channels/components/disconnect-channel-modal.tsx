import type { SocialChannel } from "@postmade/types";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

export function DisconnectChannelModal({
  channel,
  onClose,
  onConfirm,
}: {
  channel: SocialChannel | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("channels");
  return (
    <Modal closeLabel={t("actions.close")} onClose={onClose} open={Boolean(channel)} title={t("disconnectModal.title")}>
      {channel && (
        <>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("disconnectModal.description", {
              name: channel.displayName,
              platform: t(`platforms.${channel.platform}.name`),
            })}
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>{t("actions.cancel")}</Button>
            <Button type="button" onClick={onConfirm}>{t("actions.confirmDisconnect")}</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
