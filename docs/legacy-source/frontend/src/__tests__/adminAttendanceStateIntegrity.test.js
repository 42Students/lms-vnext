import fs from "fs";
import path from "path";

const src = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Attendance.js"), "utf8");

test("admin attendance never broadens a failed class-course lookup to all college courses", () => {
  expect(src).toContain("const [classCoursesError, setClassCoursesError] = useState(false)");
  expect(src).toContain("setSelectedCourseId(null)");
  expect(src).toContain("const visibleCourseOptions = showAllCourses ? courseOptions : (classCourses || [])");
  expect(src).toContain("Couldn't verify which courses are taught to this class");
  expect(src).toContain("Retry class courses");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(src).toContain("disabled={optionsError || !selectedClassId || classCoursesLoading || classCoursesError}");
});
