import { z } from "zod";

export const calendarFollowupCreateSchema = z.object({
  leadId: z.string().uuid(),
  dueAt: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullable().optional(),
}).strict().refine(input=>new Date(input.dueAt).getTime()>Date.now(),{
 path:["dueAt"],message:"Pick a future date and time",
});

export const calendarFollowupMoveSchema = z.object({
  dueAt: z.iso.datetime({ offset: true }),
}).strict();

/**
 * datetime-local has no timezone. Calendar editing is explicitly IST,
 * regardless of the browser's own timezone.
 */
export function calendarLocalIstToOffset(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error("Enter a valid IST date and time.");
  }
  const offsetDate = `${value}:00+05:30`;
  if (!z.iso.datetime({ offset: true }).safeParse(offsetDate).success) {
    throw new Error("Enter a valid IST date and time.");
  }
  return offsetDate;
}

/** Format a persisted timestamp for an IST datetime-local input. */
export function calendarDueAtToIstLocal(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).formatToParts(value);
  const field = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${field("year")}-${field("month")}-${field("day")}T${field("hour")}:${field("minute")}`;
}
