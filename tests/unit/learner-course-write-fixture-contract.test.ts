import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relative: string) {
  return readFileSync(new URL("../../" + relative, import.meta.url), "utf8");
}
const names = [
  "tests/integration/learner-manual-content-completion.test.ts",
  "tests/integration/learner-course-discussion-actions.test.ts",
];
const fixturePath = "tests/support/learner-course-write-fixture.ts";

describe("isolated learner write-test fixture contract", () => {
  it.each(names)("%s never depends on an enrolled seed learner", (path) => {
    const test = source(path);
    expect(test).toContain("newLearnerCourseWriteFixture()");
    expect(test).toContain("seedLearnerCourseWriteFixture(pool,");
    expect(test).toContain("cleanupLearnerCourseWriteFixture(pool,");
    expect(test).not.toContain("Seed learner requires an active Section enrollment");
    expect(test).not.toContain("SEED_IDS.learnerCollegeAMembership");
    expect(test).not.toContain("JOIN section_enrollments");
  });

  it("creates each academic and identity prerequisite from test-owned UUIDs", () => {
    const fixture = source(fixturePath);
    for (const table of [
      "users", "college_memberships", "membership_roles",
      "academic_periods", "programs", "cohorts", "sections",
      "learner_program_enrollments", "section_enrollments",
      "courses", "course_offerings", "course_section_deliveries",
    ]) {
      expect(fixture).toContain("INSERT INTO " + table);
    }
    expect(fixture).not.toContain("INSERT INTO cohort_progression_state");
    expect(fixture).not.toContain("SEED_IDS.learnerCollegeAMembership");
    expect(fixture).not.toContain("Seed learner requires an active Section enrollment");
  });

  it("protects immutable audit/event and cohort progression records during cleanup", () => {
    const fixture = source(fixturePath);
    const cleanup = fixture.slice(fixture.indexOf("export async function cleanupLearnerCourseWriteFixture"));
    expect(cleanup).not.toMatch(/DELETE FROM (activity_events|cohort_progression_events|placement_application_status_history)/);
    expect(cleanup).toContain("cohorts WHERE id=$1");
    expect(cleanup).toContain("SELECT EXISTS(SELECT 1 FROM activity_events");
    expect(cleanup).toContain("if (!audit.rows[0]?.used)");
  });
});
