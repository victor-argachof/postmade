import type { TagGroup } from "@postmade/types";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  createWorkspaceTagGroup,
  deleteWorkspaceTagGroup,
  updateWorkspaceTagGroup,
} from "@/features/workspaces/store/workspaces-slice";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { DeleteTagGroupModal } from "../components/overlays/delete-tag-group-modal";
import { TagGroupModal } from "../components/overlays/tag-group-modal";
import { TagsDataTable } from "../components/tags-data-table";
import { TagsFilters } from "../components/tags-filters";

export function TagsPage() {
  const workspaceId = useAppSelector(
    (state) => state.workspaces.activeWorkspaceId
  );
  return <TagsPageContent key={workspaceId ?? "no-workspace"} />;
}

function TagsPageContent() {
  const { t } = useTranslation("tags");
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const workspace = useAppSelector((state) =>
    state.workspaces.items.find(
      (item) => item.id === state.workspaces.activeWorkspaceId
    )
  );
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TagGroup | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TagGroup | null>(null);
  const groups = workspace?.resources.tagGroups ?? [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = groups
    .filter(
      (group) =>
        !normalizedQuery ||
        group.name.toLocaleLowerCase().includes(normalizedQuery) ||
        group.tags.some((tag) =>
          tag.toLocaleLowerCase().includes(normalizedQuery)
        )
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const canManage = Boolean(role && role !== "viewer");
  const submit = ({ name, tags }: { name: string; tags: string[] }) => {
    if (!workspace || !user || !canManage) return;
    if (editing)
      dispatch(
        updateWorkspaceTagGroup({
          workspaceId: workspace.id,
          actorId: user.id,
          tagGroupId: editing.id,
          name,
          tags,
        })
      );
    else
      dispatch(
        createWorkspaceTagGroup({
          workspaceId: workspace.id,
          actorId: user.id,
          name,
          tags,
        })
      );
    toast.success(t(editing ? "feedback.updated" : "feedback.created"));
    setEditing(null);
    setCreating(false);
  };
  const confirmDelete = () => {
    if (!workspace || !user || !deleting || !canManage) return;
    dispatch(
      deleteWorkspaceTagGroup({
        workspaceId: workspace.id,
        actorId: user.id,
        tagGroupId: deleting.id,
      })
    );
    toast.success(t("feedback.deleted"));
    setDeleting(null);
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
      <TagsFilters query={query} onQueryChange={setQuery} />
      <TagsDataTable
        key={`${workspace?.id}-${query}`}
        canManage={canManage}
        empty={
          <div className="p-12 text-center">
            <p className="font-bold">
              {groups.length ? t("empty.filtered") : t("empty.title")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </div>
        }
        groups={filtered}
        onDelete={setDeleting}
        onEdit={setEditing}
      />
      <TagGroupModal
        key={editing?.id ?? (creating ? "new" : "closed")}
        existingNames={groups.map((group) => group.name)}
        group={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSubmit={submit}
        open={creating || Boolean(editing)}
      />
      <DeleteTagGroupModal
        group={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
