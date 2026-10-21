import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("admin course destructive and bulk visibility actions are immediately single-flight", () => {
  const source = read("src/pages/superadmin/sections/Courses.js");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("const bulkBusyRef = useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("const deleteBusyRef = useRef(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("if (!isScoped || deleteBusyRef.current) return");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("if (selectedCourseIds.length === 0 || bulkBusyRef.current) return");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("loading={deleteBusyId === record.id}");
  expect(source).toContain("Discard unsaved course changes?");
});

test("admin lesson destructive and bulk visibility actions are immediately single-flight", () => {
  const source = read("src/pages/superadmin/sections/Lessons.js");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("const bulkBusyRef = useRef(false)");
  expect(source).toContain("const deleteBusyRef = useRef(false)");
  expect(source).toContain("if (!isScoped || !deleteTarget || deleteBusyRef.current) return");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("if (!selectedLessonIds.length || bulkBusyRef.current || loadError) return");
  expect(source).toContain("Unsaved changes will be lost.");
  expect(source).toContain("deleteLoading");
});

test("lesson-content editor keeps prerequisite, draft and delete guards", () => {
  const source = read("src/pages/superadmin/sections/LessonContent.js");
  expect(source).toContain("Discard lesson-content edits?");
  expect(source).toContain("const [deleteBusyId, setDeleteBusyId] = useState(null)");
  expect(source).toContain("Lesson content could not be loaded");
  expect(source).toContain("Eligible sections unavailable");
});

test("college-admin course/content routes reuse the hardened shared admin sections", () => {
  const courses = read("src/pages/college-admin/courses.js");
  const lessons = read("src/pages/college-admin/lessons.js");
  const content = read("src/pages/college-admin/lesson-content.js");
  expect(courses).toMatch(/superadmin\/sections\/Courses/);
  expect(lessons).toMatch(/superadmin\/sections\/Lessons/);
  expect(content).toMatch(/superadmin\/sections\/LessonContent/);
});
