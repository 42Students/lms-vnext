import { describe, expect, it } from "vitest";
import {
  adaptLegacyClassScheduleCreate, legacyClassScheduleSourceSchema,
} from "@/modules/academics/validation";

const classId = "00000000-0000-4000-8000-000000000001";
const facultyId = "00000000-0000-4000-8000-000000000002";
const deliveryId = "00000000-0000-4000-8000-000000000003";
const hallId = "00000000-0000-4000-8000-000000000004";
const mapping = {
  sectionIds: new Map([[11, classId]]),
  facultyMembershipIds: new Map([[22, facultyId]]),
  deliveryIdsByLegacyCourseId: new Map([[33, deliveryId]]),
  deliveryIdsByCourseSlug: new Map([["eng101", deliveryId]]),
  lectureHallIds: new Map([[44, hallId]]),
};
const legacy = {
  class_id: 11, faculty_id: 22,
  start_time: "2026-11-03 10:00:00",
  end_time: "2026-11-03 11:00:00",
};

describe("legacy class schedule DTO adaptation", () => {
  it("preserves section-only scheduling with optional title and Indian time", () => {
    expect(adaptLegacyClassScheduleCreate(legacy, mapping)).toMatchObject({
      sectionId: classId, facultyMembershipId: facultyId,
      deliveryId: null, lectureHallId: null,
      title: "Class schedule",
      startsAt: "2026-11-03T10:00:00+05:30",
      endsAt: "2026-11-03T11:00:00+05:30",
    });
  });

  it("resolves course slug in preference to legacy course ID and validates the hall", () => {
    expect(adaptLegacyClassScheduleCreate({
      ...legacy, course_id: 999, course_slug: "eng101", lecture_hall_id: 44,
      title: "Substitution",
    }, mapping)).toMatchObject({
      deliveryId, lectureHallId: hallId, title: "Substitution",
    });
    expect(() => adaptLegacyClassScheduleCreate({
      ...legacy, course_id: 999,
    }, mapping)).toThrow("LEGACY_SCHEDULE_DELIVERY_UNMAPPED");
    expect(() => adaptLegacyClassScheduleCreate({
      ...legacy, lecture_hall_id: 45,
    }, mapping)).toThrow("LEGACY_SCHEDULE_HALL_UNMAPPED");
  });

  it("enforces old requiredness messages, no guessed UUID and no reversed time", () => {
    expect(legacyClassScheduleSourceSchema.safeParse({
      classId: 0, facultyId: 0, startTime: "", endTime: "",
    }).error?.issues.map(issue => issue.message)).toEqual(expect.arrayContaining([
      "classId must be a positive number",
      "facultyId must be a positive number",
      "startTime is required",
      "endTime is required",
    ]));
    expect(() => adaptLegacyClassScheduleCreate({
      ...legacy, class_id: 999,
    }, mapping)).toThrow("LEGACY_SCHEDULE_MEMBER_OR_SECTION_UNMAPPED");
    expect(() => adaptLegacyClassScheduleCreate({
      ...legacy, start_time: "2026-11-03 11:30:00",
    }, mapping)).toThrow();
  });
});
