import type { ChannelsLookup, SocialChannel } from "@postmade/types";

export function mergeChannelLookup(data?: ChannelsLookup): SocialChannel[] {
  const channels = new Map<string, SocialChannel>();
  for (const channel of [...(data?.options ?? []), ...(data?.included ?? [])])
    channels.set(channel.id, channel);
  return [...channels.values()];
}
