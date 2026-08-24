export type SocialPlatform =
  "facebook" | "linkedin" | "instagram" | "tiktok" | "youtube";

export type ChannelConnectionStatus =
  "connected" | "requires_reauthentication" | "unavailable" | "disconnected";

export interface SocialChannel {
  id: string;
  workspaceId: string;
  platform: SocialPlatform;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  connectionStatus: ChannelConnectionStatus;
  lastCheckedAt: string | null;
  connectedAt: string;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelSummary {
  total: number;
  byPlatform: Record<SocialPlatform, number>;
}

export interface ChannelsPage {
  items: SocialChannel[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  summary: ChannelSummary;
}

export interface ChannelsLookup {
  options: SocialChannel[];
  included: SocialChannel[];
  connectedIds: string[];
}

export interface StartChannelOAuthOutput {
  url: string;
}
