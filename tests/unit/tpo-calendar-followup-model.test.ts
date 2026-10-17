import { describe, expect, it } from "vitest";
import {
  calendarDueAtToIstLocal,
  calendarFollowupCreateSchema,
  calendarFollowupMoveSchema,
  calendarLocalIstToOffset,
} from "@/modules/placements/tpo-calendar-followup-model";

const leadId = "00000000-0000-4000-8000-000000000001";

describe("TPO calendar follow-up boundaries", () => {
  it("creates only a known lead, offset-aware date and optional note", () => {
    expect(calendarFollowupCreateSchema.parse({
      leadId,
      dueAt: "2099-10-15T09:30:00+05:30",
      note: "  Check candidates  ",
    })).toEqual({
      leadId,
      dueAt: "2099-10-15T09:30:00+05:30",
      note: "Check candidates",
    });
    for (const invalid of [
      { leadId: "bad", dueAt: "2099-10-15T09:30:00+05:30" },
      { leadId, dueAt: "2099-10-15T09:30:00" },
      { leadId, dueAt: "2099-10-15T09:30:00+05:30", collegeId: leadId },
      { leadId, dueAt: "2099-10-15T09:30:00+05:30", note: "x".repeat(501) },
    ]) {
      expect(calendarFollowupCreateSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("restricts rescheduling to a due date, never college or completion fields", () => {
    expect(calendarFollowupMoveSchema.parse({
      dueAt: "2099-10-16T10:00:00+05:30",
    })).toEqual({
      dueAt: "2099-10-16T10:00:00+05:30",
    });
    for (const input of [
      { dueAt: "2099-10-16T10:00" },
      { dueAt: "2099-10-16T10:00:00+05:30", doneAt: null },
      { dueAt: "2099-10-16T10:00:00+05:30", collegeId: leadId },
    ]) {
      expect(calendarFollowupMoveSchema.safeParse(input).success).toBe(false);
    }
  });

  it("converts datetime-local to IST regardless of the browser timezone", () => {
    expect(calendarLocalIstToOffset("2099-10-15T09:30"))
      .toBe("2099-10-15T09:30:00+05:30");
    for (const value of ["", "2099-10-15", "2099-10-15T25:00", "2099-02-30T12:00"]) {
      expect(() => calendarLocalIstToOffset(value)).toThrow();
    }
  });

  it("formats persisted instants back to IST for the reschedule input", () => {
    expect(calendarDueAtToIstLocal(new Date("2099-10-14T20:00:00.000Z")))
      .toBe("2099-10-15T01:30");
    expect(calendarDueAtToIstLocal(new Date("2099-10-15T04:00:00.000Z")))
      .toBe("2099-10-15T09:30");
  });
});
