import dayjs from "dayjs";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

/**
 * dayjs that also understands the array form the backend uses for dates ([2026, 9, 28, 20, 42, 50]), which is how Jackson
 * writes a LocalDateTime here. Strings, Dates and dayjs objects behave as they always do.
 */
export function dj(value) {
  if (Array.isArray(value)) {
    const parsed = parsePlacementUtcDateTime(value);
    return parsed ? dayjs(parsed.valueOf()) : dayjs(Number.NaN);
  }
  return dayjs(value);
}

/**
 * A picked date and time as the server stores TPO times: UTC, no offset ("2026-10-20T18:29:00"). dj() reads them back the same
 * way, so what was picked is what shows. Sending the local India time instead moved every saved time 5h30m later on each save
 * (drive deadlines drifted on every autosave; drive form audit, 5 Oct 2026).
 */
export function serverTime(value) {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.toDate().toISOString().slice(0, 19) : null;
}
