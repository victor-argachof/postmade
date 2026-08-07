import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAppDispatch } from "@/shared/hooks/store-hooks";

import { updateWorkspaceTimezone } from "../store/workspaces-slice";
import type { Workspace } from "../types";

const COMMON_TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

function getTimezones() {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  return Array.from(
    new Set([
      "UTC",
      ...COMMON_TIMEZONES,
      ...(intl.supportedValuesOf?.("timeZone") ?? []),
    ])
  ).sort();
}

export function TimezoneSettings({
  workspace,
  actorId,
  canManage,
}: {
  workspace: Workspace;
  actorId: string;
  canManage: boolean;
}) {
  const { t, i18n } = useTranslation("workspaces");
  const dispatch = useAppDispatch();
  const [timezone, setTimezone] = useState(workspace.timezone);
  const [confirming, setConfirming] = useState(false);
  const timezones = useMemo(getTimezones, []);
  useEffect(
    () => setTimezone(workspace.timezone),
    [workspace.id, workspace.timezone]
  );
  const valid =
    timezones.includes(timezone) ||
    (() => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: timezone });
        return true;
      } catch {
        return false;
      }
    })();
  const currentTime = (zone: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: zone,
    }).format(new Date());
  const confirm = () => {
    dispatch(
      updateWorkspaceTimezone({ workspaceId: workspace.id, actorId, timezone })
    );
    setConfirming(false);
    toast.success(t("timezone.saved"));
  };
  return (
    <>
      <SectionCard
        className="mt-6"
        icon={Clock3}
        title={t("timezone.title")}
        description={t("timezone.description")}
      >
        <div className="mt-8">
          <label
            className="block text-sm font-medium"
            id="workspace-timezone-label"
          >
            {t("timezone.label")}
          </label>
          <Select
            disabled={!canManage}
            value={timezone}
            onValueChange={setTimezone}
          >
            <SelectTrigger
              aria-describedby="timezone-help timezone-current"
              aria-labelledby="workspace-timezone-label"
              className="mt-2 h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground" id="timezone-help">
            {t("timezone.help")}
          </p>
          {valid && (
            <p className="mt-2 text-sm font-semibold" id="timezone-current">
              {t("timezone.currentTime", { time: currentTime(timezone) })}
            </p>
          )}
          {!valid && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {t("timezone.invalid")}
            </p>
          )}
          <Button
            className="mt-5 w-full sm:w-auto"
            disabled={!canManage || !valid || timezone === workspace.timezone}
            onClick={() => setConfirming(true)}
          >
            {t("timezone.save")}
          </Button>
        </div>
      </SectionCard>
      <Modal
        closeLabel={t("timezone.cancel")}
        onClose={() => setConfirming(false)}
        open={confirming}
        title={t("timezone.confirmTitle")}
      >
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {t("timezone.confirmDescription", { timezone })}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            {t("timezone.cancel")}
          </Button>
          <Button onClick={confirm}>{t("timezone.confirm")}</Button>
        </div>
      </Modal>
    </>
  );
}
