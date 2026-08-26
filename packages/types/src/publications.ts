import type { SocialPlatform } from "./channels.js";

export type PublicationStatus =
  "draft" | "scheduled" | "publishing" | "published" | "failed";

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
  size?: number;
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

export interface PublicationTargetInput {
  channelId: string;
  contentOverride?: string | null;
  tagGroupSnapshotsOverride?: PublicationTagGroupSnapshot[] | null;
  settings?: Record<string, unknown>;
}

export interface PublicationInput {
  status: "draft" | "scheduled" | "published";
  content: string;
  targets: PublicationTargetInput[];
  tagGroupSnapshots?: PublicationTagGroupSnapshot[];
  scheduledFor?: string | null;
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

export interface PublicationsPage {
  items: ScheduledPublication[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PublicationFiltersInput {
  status?: PublicationStatus;
  platform?: SocialPlatform;
  channelId?: string;
  query?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: 10 | 25 | 50;
}
