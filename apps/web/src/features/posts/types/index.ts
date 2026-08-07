import type { PublicationStatus, SocialPlatform } from "@postmade/types";

export type PublicationFilterStatus = "all" | PublicationStatus;

export interface PublicationFilters {
  query: string;
  status: PublicationFilterStatus;
  platform: "all" | SocialPlatform;
  channelId: "all" | string;
  from: string;
  to: string;
}
