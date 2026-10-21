import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/Quizzes/QuizzesContent.jsx"), "utf8");

describe("faculty quiz create-context recovery", () => {
  test("course lookup failure is distinct from a genuine no-assignment state", () => {
    expect(source).toContain("Assigned courses could not be loaded");
    expect(source).toContain("Unable to load your assigned courses. Please try again.");
    expect(source).toContain("No assigned courses found");
    expect(source).toContain("onClick={loadFacultyMappings}");
  });

  test("lesson lookup failure is distinct from a genuinely empty course", () => {
    expect(source).toContain("Lessons could not be loaded");
    expect(source).toContain("Unable to load lessons for this course. Please try again.");
    expect(source).toContain("No lessons in this course yet");
    expect(source).toContain("Retry lessons");
  });

  test("structural course loading uses a shape-matched list instead of a bare spinner", () => {
    expect(source).toContain('ListSkeleton rows={3}');
    expect(source).not.toContain("<Spin />");
  });
});
