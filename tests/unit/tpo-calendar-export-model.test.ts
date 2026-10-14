import { describe, expect, it } from "vitest";
import {
  calendarIstBounds, todayIstDate,
  tpoCalendarExportQuerySchema, tpoCalendarRoundsCsv,
} from "@/modules/placements/tpo-calendar-export-model";

describe("TPO IST placement round CSV", () => {
  it("validates inclusive date ranges and rejects unknown scope fields", () => {
    expect(tpoCalendarExportQuerySchema.safeParse({
      from: "2026-10-14", to: "2026-10-21",
    }).success).toBe(true);
    expect(tpoCalendarExportQuerySchema.safeParse({
      from: "2026-02-30", to: "2026-03-01",
    }).success).toBe(false);
    expect(tpoCalendarExportQuerySchema.safeParse({
      from: "2026-10-21", to: "2026-10-14",
    }).success).toBe(false);
    expect(tpoCalendarExportQuerySchema.safeParse({
      from: "2026-10-14", to: "2027-01-31",
    }).success).toBe(false);
    expect(tpoCalendarExportQuerySchema.safeParse({
      from: "2026-10-14", to: "2026-10-21",
      collegeId: "20000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
  });
  it("keeps India-local midnight bounds and handles the UTC-date crossover", () => {
    expect(calendarIstBounds("2026-10-14", "2026-10-14"))
      .toEqual({
        start: new Date("2026-10-13T18:30:00.000Z"),
        endExclusive: new Date("2026-10-14T18:30:00.000Z"),
      });
    expect(todayIstDate(new Date("2026-10-13T20:00:00.000Z"))).toBe("2026-10-14");
  });
  it("escapes formula cells, includes a visible truncation row", () => {
    const output = tpoCalendarRoundsCsv([{
      id: "one", jobTitle: "=CMD()", companyName: "+COMPANY",
      roundName: "Interview", kind: "INTERVIEW", mode: "ON_CAMPUS",
      status: "SCHEDULED", scheduledAt: new Date("2026-10-14T03:30:00Z"),
      venue: null,
    }], true);
    expect(output).toContain("\"'=CMD()\"");
    expect(output).toContain("\"'+COMPANY\"");
    expect(output).toContain("export truncated");
    expect(output).toContain('"2026-10-14T03:30:00.000Z"');
    expect(tpoCalendarRoundsCsv([], false).split("\r\n")).toHaveLength(1);
  });
});
