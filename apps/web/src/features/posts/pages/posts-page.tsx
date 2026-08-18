import type { ScheduledPublication } from "@postmade/types";
import { Plus } from "lucide-react";
import { useState } from "react";
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

import { CancelScheduleModal } from "../components/overlays/cancel-schedule-modal";
import { DeletePublicationModal } from "../components/overlays/delete-publication-modal";
import { DuplicatePublicationModal } from "../components/overlays/duplicate-publication-modal";
import { PostsDataTable } from "../components/posts-data-table";
import { PostsFilters } from "../components/posts-filters";
import { PostsViewSwitcher } from "../components/posts-view-switcher";
import { filterPublications, selectActiveWorkspace } from "../lib/selectors";
import { setPublicationFilters } from "../store/posts-slice";

export function PostsPage() {
  const workspaceId = useAppSelector(
    (state) => state.workspaces.activeWorkspaceId
  );
  return <PostsPageContent key={workspaceId ?? "no-workspace"} />;
}

function PostsPageContent() {
  const { t, i18n } = useTranslation("posts");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const workspace = useAppSelector(selectActiveWorkspace);
  const user = useAppSelector((state) => state.auth.user);
  const filters = useAppSelector((state) => state.posts.filters);
  const [duplicating, setDuplicating] = useState<ScheduledPublication | null>(
    null
  );
  const [canceling, setCanceling] = useState<ScheduledPublication | null>(null);
  const [deleting, setDeleting] = useState<ScheduledPublication | null>(null);
  const publications = workspace?.resources.posts ?? [];
  const filtered = filterPublications(publications, filters);
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const canManage = Boolean(role && role !== "viewer");
  const executeAction = (
    type: "delete" | "cancel" | "duplicate" | "retry",
    id: string
  ) => {
    if (!workspace || !user) return;
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
  const requestAction = (
    type: "delete" | "cancel" | "duplicate" | "retry",
    id: string
  ) => {
    const publication = publications.find((post) => post.id === id);
    if (!publication) return;
    if (type === "duplicate") setDuplicating(publication);
    else if (type === "cancel") setCanceling(publication);
    else if (type === "delete") setDeleting(publication);
    else executeAction(type, id);
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
      <PostsViewSwitcher />
      <PostsFilters
        channels={workspace?.resources.channels ?? []}
        filters={filters}
        onChange={(change) => dispatch(setPublicationFilters(change))}
      />
      <PostsDataTable
        key={`${workspace?.id}-${JSON.stringify(filters)}`}
        canManage={canManage}
        channels={workspace?.resources.channels ?? []}
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
        onAction={requestAction}
        onEdit={(id) => navigate(ROUTES.editPost(id))}
        publications={filtered}
        timezone={workspace?.timezone ?? "UTC"}
      />
      <DuplicatePublicationModal
        publication={duplicating}
        onClose={() => setDuplicating(null)}
        onConfirm={() => {
          if (duplicating) executeAction("duplicate", duplicating.id);
          setDuplicating(null);
        }}
      />
      <CancelScheduleModal
        publication={canceling}
        onClose={() => setCanceling(null)}
        onConfirm={() => {
          if (canceling) executeAction("cancel", canceling.id);
          setCanceling(null);
        }}
      />
      <DeletePublicationModal
        publication={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) executeAction("delete", deleting.id);
          setDeleting(null);
        }}
      />
    </section>
  );
}
