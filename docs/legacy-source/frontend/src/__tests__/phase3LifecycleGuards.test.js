import fs from "fs";
import path from "path";

describe("Phase 3 lifecycle guards", () => {
  const course = fs.readFileSync(path.join(process.cwd(), "src/pages/learn/courses/[courseId]/[...courseTab].js"), "utf8");
  const batch = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/BatchPromotion.js"), "utf8");

  test("direct learner course routes apply the same lifecycle policy as the list", () => {
    expect(course).toContain('import { learnerAvailability }');
    expect(course).toContain("const availability = learnerAvailability(course);");
    expect(course).toContain("if (!availability.visible || !availability.actionable)");
    expect(course).toContain('message={courseUnavailableReason ? "Course unavailable" : "Could not load course"}');
  });

  test("batch promotion requires explicit ACTIVE status", () => {
    expect(batch).toContain('const isActiveBatch = (batch) => batchStatus(batch) === "ACTIVE";');
    expect(batch).toContain('if (status !== "ACTIVE")');
    expect(batch).toContain('const isActive = status === "ACTIVE";');
    expect(batch).toContain('"Status unavailable"');
  });
});
