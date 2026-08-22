export interface TagGroup {
  id: string;
  name: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagGroupInput {
  name: string;
  tags: string[];
}

export type UpdateTagGroupInput = CreateTagGroupInput;
export type TagGroupSortBy = "name" | "tagCount" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export interface TagGroupsQuery {
  page?: number;
  pageSize?: 10 | 25 | 50;
  query?: string;
  sortBy?: TagGroupSortBy;
  sortDirection?: SortDirection;
}

export interface TagGroupsPage {
  items: TagGroup[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TagGroupLookupQuery {
  query?: string;
  limit?: number;
  includeIds?: string[];
}

export interface TagGroupLookupResult {
  options: TagGroup[];
  existingIds: string[];
}
