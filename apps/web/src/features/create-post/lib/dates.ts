export function utcToZonedInput(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

export function zonedInputToUtc(value: string, timezone: string) {
  const [date, time] = value.split("T");
  const [year = 1970, month = 1, day = 1] = date!.split("-").map(Number);
  const [hour = 0, minute = 0] = time!.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = utcToZonedInput(new Date(candidate).toISOString(), timezone);
    const [shownDate, shownTime] = shown.split("T");
    const [sy = 1970, sm = 1, sd = 1] = shownDate!.split("-").map(Number);
    const [sh = 0, smin = 0] = shownTime!.split(":").map(Number);
    candidate += desired - Date.UTC(sy, sm - 1, sd, sh, smin);
  }
  return new Date(candidate).toISOString();
}
