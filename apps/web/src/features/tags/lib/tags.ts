import type { PublicationTagGroupSnapshot, TagGroup } from "@postmade/types";

const TAG_PATTERN = /^[\p{L}\p{N}_]+$/u;

export function normalizeTag(value: string) {
  return value.trim().replace(/^#+/, "");
}

export function normalizeTags(values: string[]) {
  const seen = new Set<string>();
  return values.reduce<string[]>((result, value) => {
    const tag = normalizeTag(value);
    const key = tag.toLocaleLowerCase();
    if (!tag || !TAG_PATTERN.test(tag) || seen.has(key)) return result;
    seen.add(key);
    result.push(tag);
    return result;
  }, []);
}

export function isValidTag(value: string) {
  const tag = normalizeTag(value);
  return Boolean(tag && TAG_PATTERN.test(tag));
}

export function createTagGroupSnapshot(
  group: TagGroup
): PublicationTagGroupSnapshot {
  return { groupId: group.id, groupName: group.name, tags: [...group.tags] };
}

export function snapshotTags(snapshots: PublicationTagGroupSnapshot[]) {
  return normalizeTags(snapshots.flatMap((snapshot) => snapshot.tags));
}

export function effectivePublicationContent(
  content: string,
  snapshots: PublicationTagGroupSnapshot[]
) {
  const hashtags = snapshotTags(snapshots)
    .map((tag) => `#${tag}`)
    .join(" ");
  const base = content.trim();
  if (!hashtags) return base;
  return base ? `${base}\n\n${hashtags}` : hashtags;
}
