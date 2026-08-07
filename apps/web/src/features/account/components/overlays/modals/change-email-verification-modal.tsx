import { useTranslation } from "react-i18next";

import { EmailVerificationForm } from "@/features/auth/components/email-verification-form";
import { Modal } from "@/shared/components/ui/modal";

export function ChangeEmailVerificationModal({
  email,
  onClose,
  onVerified,
  open,
}: {
  email: string;
  onClose: () => void;
  onVerified: () => void;
  open: boolean;
}) {
  const { t } = useTranslation("account");

  return (
    <Modal
      closeLabel={t("closeEmailVerification")}
      open={open}
      title={t("emailVerificationModalTitle")}
      onClose={onClose}
    >
      {email && (
        <EmailVerificationForm
          email={email}
          showBackAction={false}
          onBack={onClose}
          onVerified={onVerified}
        />
      )}
    </Modal>
  );
}
