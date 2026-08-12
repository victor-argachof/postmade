export type SocialPlatform =
  "facebook" | "linkedin" | "instagram" | "tiktok" | "youtube";

export type PublicationStatus =
  "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  connected: boolean;
}

export interface TagGroup {
  id: string;
  name: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationTagGroupSnapshot {
  groupId: string;
  groupName: string;
  tags: string[];
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
  tagGroupSnapshotsOverride?: PublicationTagGroupSnapshot[] | null;
  mediaOverride: PublicationMedia[] | null;
  settings: Record<string, unknown>;
  status: PublicationStatus;
  errorCode: string | null;
  externalUrl: string | null;
}

export interface ScheduledPublication {
  id: string;
  createdBy: string;
  status: PublicationStatus;
  content: string;
  media: PublicationMedia[];
  targets: PublicationTarget[];
  tagGroupSnapshots?: PublicationTagGroupSnapshot[];
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Publication = ScheduledPublication;
