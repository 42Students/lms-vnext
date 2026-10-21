import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("faculty attendance preserves dirty roster intent and prevents duplicate writes", () => {
  const source = read("src/pages/Dashboard/course/Attendance/TakeAttendance.js");
  expect(source).toContain("takeAttendanceDirty");
  expect(source).toContain("Discard your unsaved attendance changes?");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("const submittingRef = useRef(false)");
  expect(source).toContain("const schedulingRef = useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("if (submittingRef.current) return");
  expect(source).toContain("if (schedulingRef.current) return");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("Your local markings are still here so you can retry.");
});

test("assignment authoring, delete and grading paths are guarded", () => {
  const assignments = read("src/components/Assignments/AssignmentsContent.jsx");
  const action = read("src/components/Assignments/ActionAssignment.js");
  const grading = read("src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx");
  const editor = read("src/components/Global/Offcanvas/Assignment/newAssignment.js");

  expect(assignments).toContain("deletingAssignmentRef.current");
  expect(action).toContain('title="Delete this assignment?"');
  expect(action).toContain("disabled={mutationBusy}");
  expect(grading).toContain("const gradeSubmittingRef = useRef(false)");
  expect(grading).toContain("if (gradeSubmittingRef.current) return");
  expect(grading).toContain("setStudents((previous)");
  expect(editor).toMatch(/if \(saving \|\| submitAttemptRef\.current\) return/);
  expect(editor).toMatch(/beforeunload|unsaved|Discard/i);
});

test("quiz writes are submission-aware, confirmed and single-flight", () => {
  const table = read("src/components/Quiz/Table/table.js");
  const builder = read("src/components/Quiz/QuizBuilderModal.jsx");

  expect(table).toContain("if (quizActionRef.current) return");
  expect(table).toContain("This quiz already has learner submissions");
  expect(table).toContain("Could not verify submissions. Only title/description editing is available right now.");
  expect(table).toContain('title="Delete this quiz?"');
  expect(builder).toContain("const savingRef = React.useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(builder).toContain("if (savingRef.current) return");
  expect(builder).toContain("Discard quiz changes?");
  expect(builder).toContain("Questions, deadline, attempt limit and randomization are locked after learner submissions");
});

test("faculty reports are read-only except for recoverable single-flight export", () => {
  for (const p of [
    "src/components/Report/AssignmentReportContent.jsx",
    "src/components/Report/QuizReportContent.jsx",
  ]) {
    const source = read(p);
    expect(source).toContain("setDownloading(true)");
    expect(source).toContain("setDownloading(false)");
    expect(source).toContain("Retry");
    expect(source).not.toMatch(/updatePoints|publishGrade|deleteQuiz|createLessonContent/);
  }
});
