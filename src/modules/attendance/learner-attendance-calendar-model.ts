import { z } from "zod";
import type { LearnerAttendanceStatus } from "@/modules/attendance/model";

const monthSchema = z.string().regex(/^(?:19|20|21)\d\d-(?:0[1-9]|1[0-2])$/);
export const learnerAttendanceCalendarQuerySchema = z.object({
  month: monthSchema.optional(),
  deliveryId: z.union([z.literal("ALL"), z.string().uuid()]).default("ALL"),
  status: z.enum(["ALL", "PRESENT", "ABSENT", "EXCUSED", "MEDICAL",
    "LATE", "NOT_MARKED", "SCHEDULED"]).default("ALL"),
}).strict();

export type LearnerAttendanceCalendarQuery = {
  month: string;
  deliveryId: string;
  status: "ALL" | LearnerAttendanceStatus;
};

export type LearnerAttendanceCalendarRecord = {
  id: string;
  deliveryId: string;
  courseCode: string;
  courseName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: LearnerAttendanceStatus;
};

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
});

export function attendanceCalendarDayKey(at: Date) {
  const parts = dayFormatter.formatToParts(at);
  const find = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return find("year") + "-" + find("month") + "-" + find("day");
}

export function attendanceCalendarCurrentMonth(now: Date) {
  return attendanceCalendarDayKey(now).slice(0, 7);
}

export function parseAttendanceCalendarQuery(raw: unknown, now = new Date()) {
  const parsed = learnerAttendanceCalendarQuerySchema.parse(raw);
  return {
    month: parsed.month ?? attendanceCalendarCurrentMonth(now),
    deliveryId: parsed.deliveryId,
    status: parsed.status,
  } satisfies LearnerAttendanceCalendarQuery;
}

export function selectAttendanceCalendarRecords<T extends LearnerAttendanceCalendarRecord>(
  rows: readonly T[], query: LearnerAttendanceCalendarQuery,
) {
  return rows.filter(row =>
    attendanceCalendarDayKey(row.startsAt).startsWith(query.month + "-") &&
    (query.deliveryId === "ALL" || row.deliveryId === query.deliveryId) &&
    (query.status === "ALL" || row.status === query.status),
  ).sort((a, b) =>
    a.startsAt.getTime() - b.startsAt.getTime() || a.id.localeCompare(b.id),
  );
}

export function attendanceCalendarSummary(rows: readonly LearnerAttendanceCalendarRecord[]) {
  const scheduled = rows.filter(row => row.status === "SCHEDULED").length;
  const unmarked = rows.filter(row => row.status === "NOT_MARKED").length;
  const present = rows.filter(row => row.status === "PRESENT").length;
  const otherMarked = rows.length - scheduled - unmarked - present;
  const marked = present + otherMarked;
  return {
    scheduled, unmarked, present, otherMarked, marked, total: rows.length,
    percentage: marked === 0 ? null : Math.round(present / marked * 100),
  };
}

export function attendanceCalendarDays(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year!, monthNum! - 1, 1));
  const length = new Date(Date.UTC(year!, monthNum!, 0)).getUTCDate();
  const padding = first.getUTCDay();
  return [
    ...Array.from({ length: padding }, () => null),
    ...Array.from({length}, (_, i) =>
      month + "-" + String(i + 1).padStart(2, "0")),
  ];
}

export function shiftAttendanceCalendarMonth(month: string, offset: -1 | 1) {
  const [year, num] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, num! - 1 + offset, 1));
  return shifted.getUTCFullYear() + "-" +
    String(shifted.getUTCMonth() + 1).padStart(2, "0");
}

export function attendanceCalendarHref(query: LearnerAttendanceCalendarQuery) {
  const params = new URLSearchParams({month:query.month});
  if(query.deliveryId !== "ALL") params.set("deliveryId",query.deliveryId);
  if(query.status !== "ALL") params.set("status",query.status);
  return "/learn/attendance/calendar?" + params.toString();
}

/**
 * A calendar month is an Asia/Kolkata wall-clock range, not a UTC month.
 * Use a half-open interval so month boundaries cannot double-count sessions.
 */
export function learnerAttendanceMonthWindow(month: string) {
  if (!monthSchema.safeParse(month).success) throw new Error("Invalid attendance calendar month");
  const [year, monthNumber] = month.split("-").map(Number);
  const istOffsetMilliseconds = 330 * 60 * 1000;
  return {
    from: new Date(Date.UTC(year!, monthNumber! - 1, 1) - istOffsetMilliseconds),
    to: new Date(Date.UTC(year!, monthNumber!, 1) - istOffsetMilliseconds),
  };
}


/** Legacy inclusive YYYY-MM-DD date range, normalized to canonical IST.
 * The half-open UTC end avoids duplicate month-end records regardless of
 * a traveller's browser timezone or DST rules. Course IDs must still be
 * resolved to an authorized delivery, never blindly coerced to UUIDs. */
export function legacyAttendanceInclusiveWindow(startDay:string,endDay:string){
 const date=z.iso.date();
 if(!date.safeParse(startDay).success||!date.safeParse(endDay).success||
   endDay<startDay)throw new Error("Invalid attendance date range");
 function start(day:string){
  const [year,month,date]=day.split("-").map(Number);
  const plain=new Date(Date.UTC(year!,month!-1,date!));
  if(plain.toISOString().slice(0,10)!==day)
   throw new Error("Invalid attendance date");
  return plain.getTime()-330*60_000;
 }
 const from=start(startDay),to=start(endDay)+86_400_000;
 if(to<=from)throw new Error("Invalid attendance date range");
 return {from:new Date(from),to:new Date(to)};
}
export function attendanceWithinIstWindow(at:Date,range:{from:Date;to:Date}){
 return at.getTime()>=range.from.getTime()&&at.getTime()<range.to.getTime();
}
