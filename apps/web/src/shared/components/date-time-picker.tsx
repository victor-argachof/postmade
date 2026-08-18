import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

function monthGrid(month: string) {
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function nextQuarterHour(value: string) {
  const [date = "", time = "00:00"] = value.split("T");
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const roundedMinutes = Math.ceil(minute / 15) * 15;
  const instant = new Date(`${date}T00:00:00Z`);
  instant.setUTCMinutes(hour * 60 + roundedMinutes);
  return instant.toISOString().slice(0, 16);
}

export function DatePicker({
  "aria-label": ariaLabel,
  className,
  disabled = false,
  min,
  onChange,
  placement = "bottom",
  value,
}: {
  "aria-label": string;
  className?: string;
  disabled?: boolean;
  min?: string;
  onChange: (value: string) => void;
  placement?: "top" | "bottom";
  value: string;
}) {
  const { t, i18n } = useTranslation("common");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [monthState, setMonthState] = useState({
    value,
    month: (value || today).slice(0, 7),
  });
  const month =
    monthState.value === value
      ? monthState.month
      : (value || today).slice(0, 7);
  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !wrapperRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) =>
        new Intl.DateTimeFormat(i18n.language, {
          weekday: "narrow",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2026, 7, 2 + day)))
      ),
    [i18n.language]
  );
  const monthLabel = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
  const display = value
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(`${value}T12:00:00Z`))
    : t("datePicker.placeholder");
  const changeMonth = (amount: number) => {
    const [year = 1970, number = 1] = month.split("-").map(Number);
    setMonthState({
      value,
      month: new Date(Date.UTC(year, number - 1 + amount, 1))
        .toISOString()
        .slice(0, 7),
    });
  };
  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="w-full justify-start overflow-hidden font-normal whitespace-nowrap"
        disabled={disabled}
        type="button"
        variant="outline"
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {display}
        </span>
      </Button>
      {open && (
        <div
          aria-label={t("datePicker.calendar")}
          className={cn(
            "absolute left-0 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          )}
          role="dialog"
        >
          <div className="flex items-center justify-between">
            <Button
              aria-label={t("datePicker.previousMonth")}
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="font-bold capitalize">{monthLabel}</p>
            <Button
              aria-label={t("datePicker.nextMonth")}
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-7">
            {weekdays.map((day, index) => (
              <span
                className="py-2 text-center text-xs font-bold text-muted-foreground"
                key={`${day}-${index}`}
              >
                {day}
              </span>
            ))}
            {monthGrid(month).map((date) => (
              <button
                aria-label={new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: "long",
                  timeZone: "UTC",
                }).format(new Date(`${date}T12:00:00Z`))}
                aria-pressed={date === value}
                className={cn(
                  "grid size-10 place-items-center rounded-lg text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
                  !date.startsWith(month) && "text-muted-foreground/50",
                  date === today && "font-black text-primary",
                  date === value &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                disabled={Boolean(min && date < min)}
                key={date}
                type="button"
                onClick={() => {
                  onChange(date);
                  setOpen(false);
                }}
              >
                {Number(date.slice(-2))}
              </button>
            ))}
          </div>
          {value && (
            <Button
              className="mt-3 w-full"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {t("datePicker.clear")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function DateTimePicker({
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  disabled = false,
  disablePast = false,
  min,
  onChange,
  pickerPlacement = "bottom",
  value,
}: {
  "aria-describedby"?: string;
  "aria-label": string;
  disabled?: boolean;
  disablePast?: boolean;
  min?: string;
  onChange: (value: string) => void;
  pickerPlacement?: "top" | "bottom";
  value: string;
}) {
  const { t } = useTranslation("common");
  const [date = "", time = "09:00"] = value.split("T");
  const [hour = "09", minute = "00"] = time.split(":");
  const now = new Date();
  const localMinimum = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const effectiveMinimum = disablePast
    ? nextQuarterHour(min ?? localMinimum)
    : undefined;
  const [minimumDate, minimumTime = "00:00"] =
    effectiveMinimum?.split("T") ?? [];
  const [minimumHour = "00", minimumMinute = "00"] = minimumTime.split(":");
  const isMinimumDate = date === minimumDate;
  const update = (nextDate: string, nextHour = hour, nextMinute = minute) =>
    onChange(nextDate ? `${nextDate}T${nextHour}:${nextMinute}` : "");
  const selectDate = (nextDate: string) => {
    if (nextDate === minimumDate) {
      update(nextDate, minimumHour, minimumMinute);
      return;
    }
    update(nextDate);
  };
  useEffect(() => {
    if (
      disablePast &&
      !disabled &&
      date === minimumDate &&
      `${hour}:${minute}` < `${minimumHour}:${minimumMinute}`
    ) {
      onChange(`${date}T${minimumHour}:${minimumMinute}`);
    }
  }, [
    date,
    disablePast,
    disabled,
    hour,
    minimumDate,
    minimumHour,
    minimumMinute,
    minute,
    onChange,
  ]);
  return (
    <div
      aria-describedby={ariaDescribedBy}
      className="mt-3 grid gap-3 sm:grid-cols-2"
    >
      <div>
        <span className="mb-2 block text-sm font-medium">
          {t("datePicker.date")}
        </span>
        <DatePicker
          aria-label={ariaLabel}
          disabled={disabled}
          min={effectiveMinimum?.slice(0, 10)}
          placement={pickerPlacement}
          value={date}
          onChange={selectDate}
        />
      </div>
      <div className="flex w-full gap-2">
        <div className="min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium">
            {t("datePicker.hour")}
          </span>
          <Select
            disabled={disabled || !date}
            value={hour}
            onValueChange={(next) => update(date, next, minute)}
          >
            <SelectTrigger
              aria-label={t("datePicker.hour")}
              className="h-11 w-full"
            >
              <Clock3 className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, index) =>
                String(index).padStart(2, "0")
              ).map((item) => (
                <SelectItem
                  disabled={isMinimumDate && item < minimumHour}
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium">
            {t("datePicker.minute")}
          </span>
          <Select
            disabled={disabled || !date}
            value={minute}
            onValueChange={(next) => update(date, hour, next)}
          >
            <SelectTrigger
              aria-label={t("datePicker.minute")}
              className="h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["00", "15", "30", "45"].map((item) => (
                <SelectItem
                  disabled={
                    isMinimumDate &&
                    (hour < minimumHour ||
                      (hour === minimumHour && item < minimumMinute))
                  }
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
