export type SocialPlatform =
  "facebook" | "linkedin" | "instagram" | "tiktok" | "youtube";

export type PublicationStatus =
  "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  username: string;
  connected: boolean;
}

export interface PublicationMedia {
  id: string;
  type: "image" | "video";
  url: string;
  filename: string;
  mimeType: string;
}

export interface PublicationTarget {
  channelId: string;
  platform: SocialPlatform;
  contentOverride: string | null;
  mediaOverride: PublicationMedia[] | null;
  settings: Record<string, unknown>;
  status: PublicationStatus;
  errorCode: string | null;
  externalUrl: string | null;
}

export interface PublicationRecurrence {
  interval: number;
  unit: "day" | "week" | "month";
}

export interface ScheduledPublication {
  id: string;
  createdBy: string;
  status: PublicationStatus;
  content: string;
  media: PublicationMedia[];
  targets: PublicationTarget[];
  recurrence?: PublicationRecurrence | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Publication = ScheduledPublication;
