import { describe, expect, it } from "vitest";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";

describe("learner course workspace dev legacy copy L7", () => {
  it("uses legacy capitalization on both workspace and recovery actions", () => {
    expect(LEARNER_BACK_TO_COURSES).toBe("Back to courses");
  });
});
