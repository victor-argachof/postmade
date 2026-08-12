import type { SocialChannel } from "@postmade/types";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";

export function ChannelAvatar({
  channel,
  className,
}: {
  channel: SocialChannel;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = channel.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground",
        className
      )}
    >
      {channel.avatarUrl && !imageFailed ? (
        <img
          alt=""
          className="size-full object-cover"
          src={channel.avatarUrl}
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
