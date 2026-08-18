import type { SocialPlatform } from "@postmade/types";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";

import { platformVisuals } from "../lib/platform-visuals";

const platforms: SocialPlatform[] = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
];

export function PlatformGrid({
  counts,
  connectingPlatforms,
  disabled,
  onConnect,
}: {
  counts: Record<SocialPlatform, number>;
  connectingPlatforms: ReadonlySet<SocialPlatform>;
  disabled: boolean;
  onConnect: (platform: SocialPlatform) => void;
}) {
  const { t } = useTranslation("channels");

  return (
    <section className="mt-10" aria-labelledby="available-platforms-title">
      <h2
        id="available-platforms-title"
        className="text-2xl font-black tracking-tight"
      >
        {t("platforms.title")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("platforms.description")}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((id) => {
          const { icon: Icon, className } = platformVisuals[id];
          const connecting = connectingPlatforms.has(id);
          return (
            <article
              key={id}
              className="flex min-h-64 flex-col rounded-3xl border border-border bg-card p-6"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-2xl ${className}`}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold">
                {t(`platforms.${id}.name`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                {t(`platforms.${id}.description`)}
              </p>
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                {t(
                  `platforms.connectedCount.${counts[id] === 1 ? "singular" : "plural"}`,
                  { count: counts[id] }
                )}
              </p>
              <Button
                className="mt-4 w-full"
                disabled={disabled || connecting}
                onClick={() => onConnect(id)}
                type="button"
              >
                {connecting && (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {t(connecting ? "actions.connecting" : "actions.connect")}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
