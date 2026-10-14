import { describe, expect, it } from "vitest";
import {
  createCourseOfferingInputSchema,
  updateCourseOfferingInputSchema,
} from "@/modules/courses/validation";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";

const id1 = "10000000-0000-4000-8000-000000000001";
const id2 = "10000000-0000-4000-8000-000000000002";
const id3 = "10000000-0000-4000-8000-000000000003";

describe("College Admin course offering writes", () => {
  it("strictly requires canonical course/cohort/period with bounded credits", () => {
    const input = { courseId: id1, cohortId: id2, academicPeriodId: id3,
      type: "CORE", credits: 3 };
    expect(createCourseOfferingInputSchema.parse(input)).toMatchObject(input);
    for (const invalid of [
      { ...input, collegeId: id1 },
      { ...input, credits: 31 },
      { ...input, credits: 0 },
      { ...input, cohortId: "foreign" },
      { ...input, type: "UNKNOWN" },
      { ...input, displayOrder: -1 },
    ]) expect(createCourseOfferingInputSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects empty, additional and invalid offering updates", () => {
    expect(updateCourseOfferingInputSchema.parse({
      credits: null, type: "ELECTIVE", displayOrder: 2,
    })).toEqual({ credits: null, type: "ELECTIVE", displayOrder: 2 });
    for (const value of [{}, { collegeId: id1 }, { type: "CORE", courseId: id1 },
      { credits: 31 }, { displayOrder: -1 }]) {
      expect(updateCourseOfferingInputSchema.safeParse(value).success).toBe(false);
    }
  });

  it("registers distinct create/update/archive activity events", () => {
    expect(new Set([
      ACTIVITY_EVENT_TYPES.COURSES_OFFERING_CREATED,
      ACTIVITY_EVENT_TYPES.COURSES_OFFERING_UPDATED,
      ACTIVITY_EVENT_TYPES.COURSES_OFFERING_ARCHIVED,
    ]).size).toBe(3);
  });
});
