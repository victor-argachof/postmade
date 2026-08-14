import type { PublicationStatus } from "@postmade/types";

export const publicationFilterStatuses = [
  "draft",
  "scheduled",
  "published",
  "failed",
] satisfies PublicationStatus[];
