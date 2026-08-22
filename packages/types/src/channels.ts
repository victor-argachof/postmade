export type SocialPlatform =
  | "facebook"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube";

export interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  connected: boolean;
}
