import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  cancelWorkspacePublication,
  deleteWorkspacePublication,
  duplicateWorkspacePublication,
  retryWorkspacePublication,
} from "@/features/workspaces/store/workspaces-slice";
import { ROUTES } from "@/routes/route-paths";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store-hooks";

import { PostsDataTable } from "../components/posts-data-table";
import { PostsFilters } from "../components/posts-filters";
import { PostsSummary } from "../components/posts-summary";
import { filterPublications, selectActiveWorkspace } from "../lib/selectors";
import { setPublicationFilters } from "../store/posts-slice";

export function PostsPage() {
  const { t, i18n } = useTranslation("posts");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const workspace = useAppSelector(selectActiveWorkspace);
  const user = useAppSelector((state) => state.auth.user);
  const filters = useAppSelector((state) => state.posts.filters);
  const publications = workspace?.resources.posts ?? [];
  const filtered = filterPublications(publications, filters).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const canManage = Boolean(role && role !== "viewer");
  const action = (
    type: "delete" | "cancel" | "duplicate" | "retry",
    id: string
  ) => {
    if (
      !workspace ||
      !user ||
      (type === "delete" && !window.confirm(t("confirmDelete")))
    )
      return;
    const base = { workspaceId: workspace.id, actorId: user.id };
    if (type === "delete")
      dispatch(deleteWorkspacePublication({ ...base, publicationId: id }));
    if (type === "cancel")
      dispatch(cancelWorkspacePublication({ ...base, publicationId: id }));
    if (type === "duplicate")
      dispatch(duplicateWorkspacePublication({ ...base, sourceId: id }));
    if (type === "retry")
      dispatch(retryWorkspacePublication({ ...base, publicationId: id }));
    toast.success(t(`feedback.${type}`));
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        {canManage && (
          <Button onClick={() => navigate(ROUTES.newPost)}>
            <Plus className="size-4" />
            {t("newPost")}
          </Button>
        )}
      </div>
      <PostsSummary publications={publications} />
      <PostsFilters
        channels={workspace?.resources.channels ?? []}
        filters={filters}
        onChange={(change) => dispatch(setPublicationFilters(change))}
      />
      <PostsDataTable
        canManage={canManage}
        empty={
          <div className="p-12 text-center">
            <p className="font-bold">
              {publications.length ? t("empty.filtered") : t("empty.title")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </div>
        }
        locale={i18n.language}
        onAction={action}
        onEdit={(id) => navigate(ROUTES.editPost(id))}
        publications={filtered}
        resetKey={`${workspace?.id}-${JSON.stringify(filters)}`}
        timezone={workspace?.timezone ?? "UTC"}
      />
    </section>
  );
}
