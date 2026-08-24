import type { SocialChannel } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";

export function DisconnectChannelModal({
  channel,
  disconnecting,
  onClose,
  onConfirm,
}: {
  channel: SocialChannel | null;
  disconnecting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("channels");
  return (
    <Modal
      closeLabel={t("actions.close")}
      onClose={onClose}
      open={Boolean(channel)}
      title={t("disconnectModal.title")}
    >
      {channel && (
        <>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("disconnectModal.description", {
              name: channel.displayName,
              platform: t(`platforms.${channel.platform}.name`),
            })}
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={disconnecting}
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {t("actions.cancel")}
            </Button>
            <Button disabled={disconnecting} type="button" onClick={onConfirm}>
              {t(
                disconnecting
                  ? "actions.disconnecting"
                  : "actions.confirmDisconnect"
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
