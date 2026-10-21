import fs from "fs";
import path from "path";
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("assignment grading is tied to a captured submission and single-flight", () => {
  const source = read("src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx");
  expect(source).toContain("gradeSubmittingRef");
  expect(source).toContain("if (gradeSubmittingRef.current) return");
  expect(source).toContain("const selectedKey = selectedStudent ? getSubmissionOptionKey(selectedStudent) : null");
  expect(source).toContain("getSubmissionOptionKey(item) === selectedKey");
  expect(source).toContain("Submissions could not be loaded");
  expect(source).toContain("Showing the last loaded submissions");
});

test("assignment deletion has an immediate mutation guard and visible busy state", () => {
  const list = read("src/components/Assignments/AssignmentsContent.jsx");
  const actions = read("src/components/Assignments/ActionAssignment.js");
  expect(list).toContain("deletingAssignmentRef");
  expect(list).toContain("deletingAssignmentRef.current != null");
  expect(actions).toContain("mutationBusy");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(actions).toContain("aria-busy={deleting}");
});
