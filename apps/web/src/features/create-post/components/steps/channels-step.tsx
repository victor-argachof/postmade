import type { SocialChannel } from "@postmade/types";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";

import { PostComposerStepCard } from "../post-composer-step-card";
import { PublicationChannelsSelector } from "../publication-channels-selector";

export function ChannelsStep({ channels, disabled, onChange, onManage, value }: {
  channels: SocialChannel[];
  disabled: boolean;
  onChange: (channelIds: string[]) => void;
  onManage: () => void;
  value: string[];
}) {
  const { t } = useTranslation("createPost");
  return (
    <PostComposerStepCard
      title={t("composer.channels")}
      action={
        <Button className="h-auto p-0 text-xs" type="button" variant="link" onClick={onManage}>
          {t("composer.manageChannels")}
        </Button>
      }
    >
      <PublicationChannelsSelector channels={channels} disabled={disabled} value={value} onChange={onChange} />
    </PostComposerStepCard>
  );
}
