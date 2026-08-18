import type { SocialPlatform } from "@postmade/types";
import {
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export const platformVisuals: Record<
  SocialPlatform,
  { icon: LucideIcon; className: string }
> = {
  facebook: {
    icon: Facebook,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  linkedin: {
    icon: Linkedin,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  instagram: {
    icon: Instagram,
    className: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  tiktok: { icon: Music2, className: "bg-foreground/10 text-foreground" },
  youtube: {
    icon: Youtube,
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};
