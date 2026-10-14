import { z } from "zod";
import { placementReportCsv } from "./report-model";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a real YYYY-MM-DD date");

export const tpoCalendarExportQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
}).strict().superRefine((input, ctx) => {
  const days = Math.round(
    (Date.parse(input.to + "T00:00:00.000Z") -
      Date.parse(input.from + "T00:00:00.000Z")) / 86400000,
  );
  if (days < 0 || days > 92) {
    ctx.addIssue({ code: "custom", path: ["to"], message: "Range must be 1–93 IST calendar days" });
  }
});

/** Inclusive date range. Keep date-only fields as strings to avoid IST shifts. */
export function calendarIstBounds(from: string, to: string) {
  const start = new Date(from + "T00:00:00+05:30");
  const endExclusive = new Date(new Date(to + "T00:00:00+05:30").getTime() + 86400000);
  return { start, endExclusive };
}

export type CalendarExportRow = {
  id: string; jobTitle: string; companyName: string;
  roundName: string; kind: string; mode: string | null;
  status: string; scheduledAt: Date; venue: string | null;
};

const istFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Kolkata",
});
export function tpoCalendarRoundsCsv(
  rows: readonly CalendarExportRow[], truncated: boolean,
): string {
  const header = [
    "Company", "Drive", "Round", "Kind", "Status", "Mode",
    "Scheduled (IST)", "Scheduled (UTC)", "Venue",
  ];
  const data: (string | number | null)[][] = rows.map((row) => [
    row.companyName, row.jobTitle, row.roundName, row.kind,
    row.status, row.mode, istFormat.format(row.scheduledAt) + " IST",
    row.scheduledAt.toISOString(), row.venue,
  ]);
  if (truncated) {
    data.unshift(["NOTICE", "More than 500 matching rounds; export truncated. Narrow the date range.", "", "", "", "", "", "", ""]);
  }
  return placementReportCsv(header, data);
}
