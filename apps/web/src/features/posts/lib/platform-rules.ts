import type { PublicationMedia, SocialPlatform } from "@postmade/types";

export interface PlatformRule {
  maxCharacters: number;
  maxMedia: number;
  requiresMedia: boolean;
  acceptedMimePrefixes: string[];
}

export const PLATFORM_RULES: Record<SocialPlatform, PlatformRule> = {
  facebook: {
    maxCharacters: 63206,
    maxMedia: 10,
    requiresMedia: false,
    acceptedMimePrefixes: ["image/", "video/"],
  },
  linkedin: {
    maxCharacters: 3000,
    maxMedia: 9,
    requiresMedia: false,
    acceptedMimePrefixes: ["image/", "video/"],
  },
  instagram: {
    maxCharacters: 2200,
    maxMedia: 10,
    requiresMedia: true,
    acceptedMimePrefixes: ["image/", "video/"],
  },
  tiktok: {
    maxCharacters: 2200,
    maxMedia: 1,
    requiresMedia: true,
    acceptedMimePrefixes: ["video/"],
  },
  youtube: {
    maxCharacters: 5000,
    maxMedia: 1,
    requiresMedia: true,
    acceptedMimePrefixes: ["video/"],
  },
};

export function validateTarget(
  platform: SocialPlatform,
  content: string,
  media: PublicationMedia[]
) {
  const rule = PLATFORM_RULES[platform];
  const errors: string[] = [];
  if (!content.trim() && media.length === 0) errors.push("empty");
  if (content.length > rule.maxCharacters) errors.push("characters");
  if (rule.requiresMedia && media.length === 0) errors.push("mediaRequired");
  if (media.length > rule.maxMedia) errors.push("mediaCount");
  if (
    media.some(
      (item) =>
        !rule.acceptedMimePrefixes.some((prefix) =>
          item.mimeType.startsWith(prefix)
        )
    )
  )
    errors.push("mediaType");
  return errors;
}
