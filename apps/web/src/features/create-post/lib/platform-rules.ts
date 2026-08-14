import type { PublicationMedia, SocialPlatform } from "@postmade/types";

export interface PlatformRule {
  maxCharacters: number;
  maxMedia: number;
  requiresMedia: boolean;
  acceptedMimePrefixes: string[];
}

export const POSTMADE_MEDIA_LIMITS = {
  imageBytes: 10 * 1024 * 1024,
  videoBytes: 100 * 1024 * 1024,
  imageMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  videoMimeTypes: ["video/mp4", "video/quicktime"],
} as const;

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

export function mediaConstraintsForPlatforms(platforms: SocialPlatform[]) {
  if (!platforms.length) {
    return {
      allowsImages: true,
      allowsVideos: true,
      maxMedia: 10,
      mimeTypes: [
        ...POSTMADE_MEDIA_LIMITS.imageMimeTypes,
        ...POSTMADE_MEDIA_LIMITS.videoMimeTypes,
      ],
    };
  }
  const rules = platforms.map((platform) => PLATFORM_RULES[platform]);
  const allowsImages = rules.every((rule) =>
    rule.acceptedMimePrefixes.includes("image/")
  );
  const allowsVideos = rules.every((rule) =>
    rule.acceptedMimePrefixes.includes("video/")
  );
  return {
    allowsImages,
    allowsVideos,
    maxMedia: Math.min(...rules.map((rule) => rule.maxMedia)),
    mimeTypes: [
      ...(allowsImages ? POSTMADE_MEDIA_LIMITS.imageMimeTypes : []),
      ...(allowsVideos ? POSTMADE_MEDIA_LIMITS.videoMimeTypes : []),
    ],
  };
}

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
        ![
          ...POSTMADE_MEDIA_LIMITS.imageMimeTypes,
          ...POSTMADE_MEDIA_LIMITS.videoMimeTypes,
        ].includes(item.mimeType as never) ||
        !rule.acceptedMimePrefixes.some((prefix) =>
          item.mimeType.startsWith(prefix)
        ) ||
        (item.size ?? 0) >
          (item.type === "image"
            ? POSTMADE_MEDIA_LIMITS.imageBytes
            : POSTMADE_MEDIA_LIMITS.videoBytes)
    )
  )
    errors.push("mediaType");
  return errors;
}
