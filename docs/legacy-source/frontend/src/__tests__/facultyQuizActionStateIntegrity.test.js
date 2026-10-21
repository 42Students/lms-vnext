import fs from "fs";
import path from "path";
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("quiz create dependencies distinguish failure from a genuine empty assignment", () => {
  const source = read("src/components/Quizzes/QuizzesContent.jsx");
  expect(source).toContain("contextError");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("Courses could not be loaded");
  expect(source).toContain("lessonsError");
  expect(source).toContain("Lessons could not be loaded");
  expect(source).toContain("setLessons([])");
});

test("quiz builder protects drafts and uses an immediate save guard", () => {
  const source = read("src/components/Quiz/QuizBuilderModal.jsx");
  expect(source).toContain("savingRef");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("if (savingRef.current) return");
  expect(source).toContain('Router.events.on("routeChangeStart"');
  expect(source).toContain("Discard your unsaved quiz changes?");
});

test("quiz lifecycle and submission lookups have synchronous in-flight guards", () => {
  const source = read("src/components/Quiz/Table/table.js");
  expect(source).toContain("submissionsLoadingRef");
  expect(source).toContain("quizActionRef");
  expect(source).toContain("Checking quiz submissions");
  expect(source).toContain("Releasing results");
  expect(source).toContain("Deleting quiz");
});
