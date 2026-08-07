import type { PublicationRecurrence } from "@postmade/types";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";

const options: Array<{ key: string; value: PublicationRecurrence }> = [
  { key: "day", value: { interval: 1, unit: "day" } },
  { key: "twoDays", value: { interval: 2, unit: "day" } },
  { key: "threeDays", value: { interval: 3, unit: "day" } },
  { key: "fourDays", value: { interval: 4, unit: "day" } },
  { key: "fiveDays", value: { interval: 5, unit: "day" } },
  { key: "sixDays", value: { interval: 6, unit: "day" } },
  { key: "week", value: { interval: 1, unit: "week" } },
  { key: "twoWeeks", value: { interval: 2, unit: "week" } },
  { key: "month", value: { interval: 1, unit: "month" } },
];

const serialize = ({ interval, unit }: PublicationRecurrence) =>
  `${interval}:${unit}`;

export function PublicationRecurrenceSettings({
  enabled,
  onEnabledChange,
  onValueChange,
  value,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: PublicationRecurrence) => void;
  value: PublicationRecurrence;
}) {
  const { t } = useTranslation("posts");
  return (
    <div className="mt-4 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <label
          className="cursor-pointer text-sm font-bold"
          htmlFor="publication-recurrence"
        >
          {t("composer.recurrence.label")}
        </label>
        <Switch
          aria-label={t("composer.recurrence.label")}
          checked={enabled}
          id="publication-recurrence"
          onCheckedChange={onEnabledChange}
        />
      </div>
      {enabled && (
        <div className="mt-4 border-t border-border pt-4">
          <Select
            value={serialize(value)}
            onValueChange={(selected) => {
              const option = options.find(
                ({ value: item }) => serialize(item) === selected
              );
              if (option) onValueChange(option.value);
            }}
          >
            <SelectTrigger
              aria-label={t("composer.recurrence.interval")}
              className="h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.key} value={serialize(option.value)}>
                  {t(`composer.recurrence.options.${option.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
