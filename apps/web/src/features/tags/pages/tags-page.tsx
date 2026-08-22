import type { TagGroup } from "@postmade/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import type { DataTableSorting } from "@/shared/components/data-table";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { DeleteTagGroupModal } from "../components/overlays/delete-tag-group-modal";
import { TagGroupModal } from "../components/overlays/tag-group-modal";
import { TagsDataTable } from "../components/tags-data-table";
import { TagsFilters } from "../components/tags-filters";
import {
  useCreateTagGroupMutation,
  useDeleteTagGroupMutation,
  useGetTagGroupsQuery,
  useUpdateTagGroupMutation,
} from "../services/tags-api";

export function TagsPage() {
  const workspaceId = useAppSelector(
    (state) => state.workspaces.activeWorkspaceId
  );
  return <TagsPageContent key={workspaceId ?? "no-workspace"} />;
}

function TagsPageContent() {
  const { t } = useTranslation("tags");
  const { t: tApiError } = useTranslation("apiErrors");
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const query = searchParams.get("query") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const rawPageSize = Number(searchParams.get("pageSize"));
  const pageSize = [10, 25, 50].includes(rawPageSize) ? rawPageSize : 10;
  const sortParam = searchParams.get("sortBy");
  const sortBy = ["name", "tagCount", "createdAt", "updatedAt"].includes(
    sortParam ?? ""
  )
    ? sortParam!
    : "name";
  const sortDirection =
    searchParams.get("sortDirection") === "desc" ? "desc" : "asc";
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [editing, setEditing] = useState<TagGroup | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TagGroup | null>(null);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);
  const { data, error, isError, isFetching, isLoading, refetch } =
    useGetTagGroupsQuery(
      {
        workspaceId: workspace?.id ?? "",
        page,
        pageSize: pageSize as 10 | 25 | 50,
        query: debouncedQuery,
        sortBy: sortBy as "name" | "tagCount" | "createdAt" | "updatedAt",
        sortDirection,
      },
      { skip: !workspace }
    );
  const [createTagGroup, { isLoading: isCreating }] =
    useCreateTagGroupMutation();
  const [updateTagGroup, { isLoading: isUpdating }] =
    useUpdateTagGroupMutation();
  const [deleteTagGroup, { isLoading: isDeleting }] =
    useDeleteTagGroupMutation();
  const groups = data?.items ?? [];
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const canManage = Boolean(role && role !== "viewer");
  const updateParams = (
    values: Record<string, string | number | undefined>
  ) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values))
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    setSearchParams(next, { replace: true });
  };
  const submit = async ({ name, tags }: { name: string; tags: string[] }) => {
    if (!workspace || !user || !canManage) return;
    try {
      if (editing)
        await updateTagGroup({
          workspaceId: workspace.id,
          tagGroupId: editing.id,
          name,
          tags,
        }).unwrap();
      else
        await createTagGroup({
          workspaceId: workspace.id,
          name,
          tags,
        }).unwrap();
      toast.success(t(editing ? "feedback.updated" : "feedback.created"));
      setEditing(null);
      setCreating(false);
    } catch (error) {
      toast.error(tApiError(getApiErrorTranslationKey(error)));
    }
  };
  const confirmDelete = async () => {
    if (!workspace || !user || !deleting || !canManage) return;
    try {
      await deleteTagGroup({
        workspaceId: workspace.id,
        tagGroupId: deleting.id,
      }).unwrap();
      toast.success(t("feedback.deleted"));
      setDeleting(null);
    } catch (error) {
      toast.error(tApiError(getApiErrorTranslationKey(error)));
    }
  };
  const sorting: DataTableSorting = {
    columnId: sortBy === "tagCount" ? "tags" : "name",
    direction: sortDirection,
  };
  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("newGroup")}
          </Button>
        )}
      </div>
      <TagsFilters
        query={query}
        onQueryChange={(value) => updateParams({ query: value, page: 1 })}
      />
      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          {t("loading")}
        </p>
      ) : (
        <TagsDataTable
          key={`${workspace?.id}-${query}`}
          canManage={canManage}
          error={
            isError
              ? {
                  message: tApiError(getApiErrorTranslationKey(error)),
                  onRetry: () => void refetch(),
                }
              : undefined
          }
          empty={
            <div className="p-12 text-center">
              <p className="font-bold">
                {query ? t("empty.filtered") : t("empty.title")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
          }
          groups={groups}
          page={data?.page ?? page}
          pageSize={data?.pageSize ?? pageSize}
          totalResults={data?.total ?? 0}
          sorting={sorting}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
          onPageSizeChange={(size) => updateParams({ pageSize: size, page: 1 })}
          onSortingChange={(next) =>
            updateParams({
              sortBy: next?.columnId === "tags" ? "tagCount" : "name",
              sortDirection: next?.direction ?? "asc",
              page: 1,
            })
          }
          onDelete={setDeleting}
          onEdit={setEditing}
        />
      )}
      {isFetching && !isLoading && (
        <span className="sr-only" role="status">
          {t("loading")}
        </span>
      )}
      <TagGroupModal
        key={editing?.id ?? (creating ? "new" : "closed")}
        existingNames={groups.map((group) => group.name)}
        group={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSubmit={submit}
        submitting={isCreating || isUpdating}
        open={creating || Boolean(editing)}
      />
      <DeleteTagGroupModal
        group={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        deleting={isDeleting}
      />
    </section>
  );
}
