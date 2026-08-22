import { useTranslation } from "react-i18next";

import { EmailVerificationForm } from "@/features/auth/components/email-verification-form";
import { Modal } from "@/shared/components/ui/modal";

export function ChangeEmailVerificationModal({
  email,
  error,
  onClose,
  onVerified,
  onErrorDismiss,
  onResend,
  open,
}: {
  email: string;
  error?: string | null;
  onClose: () => void;
  onVerified: (values: { code: string }) => void | Promise<void>;
  onErrorDismiss?: () => void;
  onResend?: () => void | Promise<void>;
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
          error={error}
          showBackAction={false}
          onBack={onClose}
          onErrorDismiss={onErrorDismiss}
          onResend={onResend}
          onVerified={onVerified}
        />
      )}
    </Modal>
  );
}
