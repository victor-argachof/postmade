export type SocialPlatform =
  | "x"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube";

export type PublicationStatus = "draft" | "scheduled" | "published" | "failed";

export interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  username: string;
  connected: boolean;
}

export interface ScheduledPublication {
  id: string;
  scheduledFor: string;
  status: PublicationStatus;
  channelIds: string[];
}
