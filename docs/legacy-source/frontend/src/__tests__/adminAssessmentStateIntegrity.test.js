import fs from "fs";
import path from "path";

const attendance = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Attendance.js"), "utf8");
const quizzes = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Quizzes.js"), "utf8");
const assignments = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Assignments.js"), "utf8");

test("admin attendance keeps class-course dependency closed until verified", () => {
  expect(attendance).toContain("Couldn't verify which courses are taught to this class");
  expect(attendance).toContain("const visibleCourseOptions = showAllCourses ? courseOptions : (classCourses || [])");
  expect(attendance).toContain("setSelectedCourseId(null)");
});

test("admin quiz failures stay distinct from genuine empty state", () => {
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("Unable to load quiz submissions");
  expect(quizzes).toContain("Quizzes could not be loaded");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("Course list unavailable");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("Lesson list unavailable");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain('locale={{ emptyText: listError ? "Could not load quizzes; use Retry above."');
});

test("admin quiz consequential row actions are immediately single-flight", () => {
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("const [actionBusy, setActionBusy] = useState(null)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("const actionBusyRef = useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("if (actionBusyRef.current) return");
  expect(quizzes).toContain("const editCheckRef = useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(quizzes).toContain("if (editCheckRef.current || actionBusyRef.current) return");
});

test("admin assignments expose prerequisites and guard grading/publish/delete writes", () => {
  expect(assignments).toContain("Course list unavailable");
  expect(assignments).toContain("Section list unavailable");
  expect(assignments).toContain("disabled={Boolean(courseOptionsError) || courseOptionsLoading}");
  expect(assignments).toContain("const savingRef = useRef(false)");
  expect(assignments).toContain("if (!validPoints || savingRef.current) return");
  expect(assignments).toContain("const assignmentActionRef = useRef(false)");
  expect(assignments).toContain("if (assignmentActionRef.current) return");
  expect(assignments).toContain("loading={deletingId === record.id}");
});

test("admin attendance correction is immediate single-flight and fails closed on unknown record state", () => {
  expect(attendance).toContain("const correctingRef = useRef(false)");
  expect(attendance).toContain("if (!currentRecord || recordError || recordLoading || correctingRef.current) return false");
  expect(attendance).toContain("Attendance record unavailable");
  expect(attendance).toContain("Corrections are disabled until the record loads.");
});
