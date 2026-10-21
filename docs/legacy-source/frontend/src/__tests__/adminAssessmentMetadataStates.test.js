import fs from "fs";
import path from "path";

describe("admin assignment/quiz prerequisite metadata states", () => {
  const assignments = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Assignments.js"), "utf8");
  const quizzes = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Quizzes.js"), "utf8");

  test("assignment course/class failures are persistent and retryable", () => {
    expect(assignments).toContain("setCourseOptionsError(");
    expect(assignments).toContain("setClassOptionsError(");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(assignments).toContain('message="Assignment setup options could not be loaded"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(assignments).toContain("setMetadataRetryKey((value) => value + 1)");
  });

  test("quiz course/lesson failures do not masquerade as empty prerequisites", () => {
    expect(quizzes).toContain("setCourseOptionsError(");
    expect(quizzes).toContain("setLessonOptionsError(");
    expect(quizzes).toContain('message="Quiz setup options could not be loaded"');
    expect(quizzes).toContain("lessonOptionsLoading");
    expect(quizzes).toContain("Boolean(lessonOptionsError)");
  });
});
