import type { ScheduledPublication } from "@postmade/types";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { mergeChannelLookup } from "@/features/channels/lib/channel-lookup";
import { useLookupChannelsQuery } from "@/features/channels/services/channels-api";
import { PostsViewSwitcher } from "@/features/posts/components/posts-view-switcher";
import {
  groupPublicationsByLocalDay,
  selectActiveWorkspace,
} from "@/features/posts/lib/selectors";
import { ROUTES } from "@/routes/route-paths";
import { getApiErrorTranslationKey } from "@/shared/api/api-error";
import { DatePicker } from "@/shared/components/date-time-picker";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { useAppSelector } from "@/shared/hooks/store-hooks";

import { CalendarAgenda } from "../components/calendar-agenda";
import { CalendarGrid } from "../components/calendar-grid";
import {
  CalendarToolbar,
  type CalendarFilters,
} from "../components/calendar-toolbar";
import { PublicationDetailsPanel } from "../components/overlays/publication-details-panel";
import { RenamePublicationModal } from "../components/overlays/rename-publication-modal";
import {
  useGetPublicationsQuery,
  useUpdatePublicationTitleMutation,
} from "../services/posts-api";

const initialFilters: CalendarFilters = {
  platform: "all",
  status: "all",
  channelId: "all",
};

export function CalendarPage() {
  const workspaceId = useAppSelector(
    (state) => state.workspaces.activeWorkspaceId
  );
  return <CalendarPageContent key={workspaceId ?? "no-workspace"} />;
}

function CalendarPageContent() {
  const { t, i18n } = useTranslation("posts", { keyPrefix: "calendar" });
  const { t: tPosts } = useTranslation("posts");
  const { t: tApiError } = useTranslation("apiErrors");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const workspace = useAppSelector(selectActiveWorkspace);
  const user = useAppSelector((state) => state.auth.user);
  const today = new Date().toISOString().slice(0, 10);
  const month = /^\d{4}-\d{2}$/.test(params.get("month") ?? "")
    ? params.get("month")!
    : today.slice(0, 7);
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") ?? "")
    ? params.get("date")!
    : today;
  const [filters, setFilters] = useState(initialFilters);
  const [detail, setDetail] = useState<ScheduledPublication | null>(null);
  const [renaming, setRenaming] = useState<ScheduledPublication | null>(null);
  const [updateTitle, { isLoading: isRenaming }] =
    useUpdatePublicationTitleMutation();
  const [monthYear = "1970", monthNumber = "01"] = month.split("-");
  const rangeFrom = new Date(
    Date.UTC(Number(monthYear), Number(monthNumber) - 1, 1)
  ).toISOString();
  const rangeTo = new Date(
    Date.UTC(Number(monthYear), Number(monthNumber), 1) - 1
  ).toISOString();
  const { data: publicationPage } = useGetPublicationsQuery(
    {
      workspaceId: workspace?.id ?? "",
      page: 1,
      pageSize: 50,
      from: rangeFrom,
      to: rangeTo,
      status: filters.status === "all" ? undefined : filters.status,
      platform: filters.platform === "all" ? undefined : filters.platform,
      channelId: filters.channelId === "all" ? undefined : filters.channelId,
    },
    { skip: !workspace }
  );
  const remotePublications = useMemo(
    () => publicationPage?.items ?? [],
    [publicationPage?.items]
  );
  const channelIds = Array.from(
    new Set(
      remotePublications.flatMap((publication) =>
        publication.targets.map((target) => target.channelId)
      )
    )
  );
  const { data: channelLookup } = useLookupChannelsQuery(
    {
      workspaceId: workspace?.id ?? "",
      limit: 30,
      includeIds: channelIds.slice(0, 50),
    },
    { skip: !workspace }
  );
  const channels = mergeChannelLookup(channelLookup);
  const publications = useMemo(
    () =>
      remotePublications.filter(
        (post) =>
          post.status !== "draft" &&
          (filters.status === "all" || post.status === filters.status) &&
          (filters.platform === "all" ||
            post.targets.some(
              (target) => target.platform === filters.platform
            )) &&
          (filters.channelId === "all" ||
            post.targets.some(
              (target) => target.channelId === filters.channelId
            ))
      ),
    [remotePublications, filters]
  );
  const groups = groupPublicationsByLocalDay(
    publications,
    workspace?.timezone ?? "UTC"
  );
  const agenda = [...(groups[selectedDate] ?? [])].sort((a, b) =>
    (a.scheduledFor ?? a.publishedAt ?? "").localeCompare(
      b.scheduledFor ?? b.publishedAt ?? ""
    )
  );
  const role = workspace?.members.find(
    (member) => member.id === user?.id
  )?.role;
  const canManage = Boolean(role && role !== "viewer");
  const selectDate = (date: string) =>
    setParams({ month: date.slice(0, 7), date });
  const goMonth = (delta: number) => {
    const [year = 1970, number = 1] = month.split("-").map(Number);
    const next = new Date(Date.UTC(year, number - 1 + delta, 1))
      .toISOString()
      .slice(0, 7);
    setParams({ month: next, date: `${next}-01` });
  };
  const newPost = () => navigate(`${ROUTES.newPost}?date=${selectedDate}`);
  const monthLabel = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={tPosts("pageTitle")}
          description={tPosts("pageDescription")}
        />
        {canManage && (
          <Button onClick={newPost}>
            <Plus className="size-4" />
            {t("newPost")}
          </Button>
        )}
      </div>
      <PostsViewSwitcher />
      <CalendarToolbar
        channels={channels}
        filters={filters}
        monthLabel={monthLabel}
        onChange={(change) =>
          setFilters((current) => ({ ...current, ...change }))
        }
        onMonthChange={goMonth}
        onToday={() => selectDate(today)}
      />
      <div className="mt-5 md:hidden">
        <DatePicker
          aria-label={t("selectDate")}
          value={selectedDate}
          onChange={selectDate}
        />
      </div>
      <div className="mt-5">
        <CalendarGrid
          canManage={canManage}
          groups={groups}
          month={month}
          onCreatePublication={(date) =>
            navigate(`${ROUTES.newPost}?date=${date}`)
          }
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          onSelectPublication={setDetail}
        />
      </div>
      <CalendarAgenda
        canManage={canManage}
        date={selectedDate}
        locale={i18n.language}
        onAdd={newPost}
        onSelect={setDetail}
        publications={agenda}
        timezone={workspace?.timezone ?? "UTC"}
      />
      <PublicationDetailsPanel
        canManage={canManage}
        channels={channels}
        onClose={() => setDetail(null)}
        onEdit={(id) => navigate(ROUTES.editPost(id))}
        onRename={setRenaming}
        publication={detail}
      />
      <RenamePublicationModal
        isLoading={isRenaming}
        key={renaming?.id ?? "closed"}
        publication={renaming}
        onClose={() => {
          if (!isRenaming) setRenaming(null);
        }}
        onConfirm={async (title) => {
          if (!workspace || !renaming) return;
          try {
            const updated = await updateTitle({
              workspaceId: workspace.id,
              publicationId: renaming.id,
              title,
            }).unwrap();
            setDetail(updated);
            setRenaming(null);
            toast.success(tPosts("feedback.rename"));
          } catch (requestError) {
            toast.error(tApiError(getApiErrorTranslationKey(requestError)));
          }
        }}
      />
    </section>
  );
}
