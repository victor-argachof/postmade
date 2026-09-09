import type { ScheduledPublication } from "@postmade/types";

export function publicationDisplayTitle(
  publication: ScheduledPublication,
  mediaFallback: string
) {
  return publication.title || publication.content || mediaFallback;
}
