import { z } from "zod";
export const tpoRoundCalendarMutationSchema = z.object({
  confirmed: z.literal(true),
  roundId: z.string().uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }).transform(value=>new Date(value).toISOString()),
  action: z.enum(["SCHEDULE", "CANCEL"]),
  localDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  mode: z.enum(["ON_CAMPUS", "VIRTUAL"]).optional(),
  venue: z.string().trim().max(500).optional(),
  meetingUrl: z.url({protocol:/^https?$/}).max(2000).optional(),
  reason: z.string().trim().max(1000).optional(),
}).strict().superRefine((data, ctx) => {
  if (data.action === "SCHEDULE" &&
    (!data.localDateTime || !data.mode ||
      (data.mode === "ON_CAMPUS" && !data.venue) ||
      (data.mode === "VIRTUAL" && !data.meetingUrl))) {
    ctx.addIssue({ code: "custom", path: ["action"], message: "Time, mode and location/meeting link are required" });
  }
  if (data.action === "CANCEL" && (!data.reason || data.reason.length < 3)) {
    ctx.addIssue({ code: "custom", path: ["reason"], message: "Cancellation requires a reason" });
  }
});
/** Explicit IST wall clock -> UTC; never use browser or server local time zone. */
export function parseIstRoundLocalTime(value: string): Date {
  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).parse(value);
  const utc = new Date(parsed + ":00+05:30");
  if (Number.isNaN(utc.getTime())) throw new Error("Invalid IST date and time");
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(utc);
  const parts = new Map(formatted.map((item) => [item.type, item.value]));
  const rebuilt = parts.get("year") + "-" + parts.get("month") + "-" +
    parts.get("day") + "T" + parts.get("hour") + ":" + parts.get("minute");
  if (rebuilt !== parsed) throw new Error("Invalid IST calendar date and time");
  return utc;
}
