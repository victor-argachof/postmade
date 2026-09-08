import { useTranslation } from "react-i18next";

import { DateTimePicker } from "@/shared/components/date-time-picker";

import { PostComposerStepCard } from "../post-composer-step-card";
import {
  PublicationTimingSwitcher,
  type PublicationTimingMode,
} from "../publication-timing-switcher";

export function SchedulingStep({
  disabled,
  minimumSchedule,
  maximumSchedule,
  onScheduledForChange,
  onTimingModeChange,
  scheduledFor,
  timezone,
  timingMode,
}: {
  disabled: boolean;
  minimumSchedule: string;
  maximumSchedule: string;
  onScheduledForChange: (value: string) => void;
  onTimingModeChange: (mode: PublicationTimingMode) => void;
  scheduledFor: string;
  timezone: string;
  timingMode: PublicationTimingMode;
}) {
  const { t } = useTranslation("createPost");
  return (
    <PostComposerStepCard title={t("composer.schedule")}>
      <PublicationTimingSwitcher
        disabled={disabled}
        value={timingMode}
        onChange={onTimingModeChange}
      >
        {timingMode === "scheduled" && (
          <div>
            <p className="text-sm text-muted-foreground" id="schedule-timezone">
              {t("composer.timezone", { timezone })}
            </p>
            <DateTimePicker
              aria-describedby="schedule-timezone"
              aria-label={t("composer.schedule")}
              disabled={disabled}
              disablePast={!disabled}
              min={minimumSchedule}
              max={maximumSchedule}
              pickerPlacement="top"
              value={scheduledFor}
              onChange={onScheduledForChange}
            />
          </div>
        )}
      </PublicationTimingSwitcher>
    </PostComposerStepCard>
  );
}
