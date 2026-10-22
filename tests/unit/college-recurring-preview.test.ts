import { describe, expect, it } from "vitest";
import {
  expandIstSessions, findPreviewConflicts, recurringPreviewSchema,
} from "@/modules/academics/college-recurring-preview-model";
import { collegePreviewErrorLabel } from "@/modules/academics/college-recurring-preview-ui-model";

const input = {
  sectionId: "10000000-0000-4000-8000-000000000001",
  from: "2026-10-15", to: "2026-10-16",
  weekdays: [4, 5], startTime: "09:00", endTime: "10:00",
  facultyMembershipId: "10000000-0000-4000-8000-000000000002",
  lectureHallId: "10000000-0000-4000-8000-000000000003",
};
describe("College recurring preview is IST-safe and bounded", () => {
  it("expands precisely at UTC+05:30 without local server timezone assumptions", () => {
    const slots = expandIstSessions(recurringPreviewSchema.parse(input));
    expect(slots.map(x => x.localDate)).toEqual(["2026-10-15", "2026-10-16"]);
    expect(slots[0].startsAt).toBe("2026-10-15T03:30:00.000Z");
    expect(slots[0].endsAt).toBe("2026-10-15T04:30:00.000Z");
  });
  it("requires unique weekdays, valid calendar dates, bounded range and increasing times", () => {
    for (const bad of [
      { ...input, weekdays: [4, 4] },
      { ...input, from: "2026-02-30" },
      { ...input, to: "2027-10-16", weekdays: [] },
      { ...input, startTime: "10:00", endTime: "09:00" },
      { ...input, collegeId: "user-overridden" },
      { ...input, sectionId: "bad" },
    ]) expect(recurringPreviewSchema.safeParse(bad).success).toBe(false);
  });
  it("reports only overlapping section/faculty/hall conflicts", () => {
    const slot = expandIstSessions(recurringPreviewSchema.parse(input))[0];
    const colliding = {
      sectionId: input.sectionId, facultyMembershipId: input.facultyMembershipId,
      lectureHallId: input.lectureHallId,
      startsAt: new Date("2026-10-15T03:45:00Z"),
      endsAt: new Date("2026-10-15T04:15:00Z"),
    };
    expect(findPreviewConflicts(slot, input, [colliding]))
      .toEqual(["SECTION_BUSY", "FACULTY_BUSY", "HALL_BUSY"]);
    expect(findPreviewConflicts(slot, input, [{
      ...colliding, startsAt: new Date("2026-10-15T04:30:00Z"),
      endsAt: new Date("2026-10-15T05:30:00Z"),
    }])).toEqual([]);
  });
  it("truncates displayed error payloads", () => {
    const hostile = collegePreviewErrorLabel({ error: "x".repeat(200) });
    expect(hostile).toBe("The schedule preview could not be loaded");
    expect(hostile).not.toContain("x".repeat(10));
    expect(collegePreviewErrorLabel({ detail: "provider secret" })).toBe(hostile);
  });
});
