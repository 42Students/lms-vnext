import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/superadmin/sections/LessonContent.js"),
  "utf8"
);

test("lesson-content prerequisite sources fail closed instead of becoming empty selectors", () => {
  expect(src).toContain("const [coursesError, setCoursesError] = useState(null)");
  expect(src).toContain("const [facultyError, setFacultyError] = useState(null)");
  expect(src).toContain("const [lessonsError, setLessonsError] = useState(null)");
  expect(src).toContain("const [classesError, setClassesError] = useState(null)");
  expect(src).toContain("Courses unavailable");
  expect(src).toContain("Faculty unavailable");
  expect(src).toContain("Lessons unavailable");
  expect(src).toContain("Eligible sections unavailable");
  expect(src).toContain("disabled={Boolean(coursesError) || Boolean(facultyError) || Boolean(lessonsError) || Boolean(classesError)");
});

test("lesson-content list failure is distinct from genuine no-content state", () => {
  expect(src).toContain("const [contentsError, setContentsError] = useState(null)");
  expect(src).toContain("Lesson content could not be loaded");
  expect(src).toContain("Retry content");
  expect(src).toContain('contentsError ? "Could not load content; use Retry above."');
});

test("lesson-content edit and delete paths protect state", () => {
  expect(src).toContain("const [editDirty, setEditDirty] = useState(false)");
  expect(src).toContain("Discard lesson-content edits?");
  expect(src).toContain("maskClosable={false}");
  expect(src).toContain("if (editModalVisible) setEditDirty(true)");
  expect(src).toContain("const [deleteBusyId, setDeleteBusyId] = useState(null)");
  expect(src).toContain("loading={deleteBusyId === record.id}");
});
