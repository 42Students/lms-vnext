import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("faculty course bootstrap fails closed when assignment context cannot be verified", () => {
  const source = read("src/pages/teacher/courses/[courseId]/[...courseTab].js");
  expect(source).toContain("Faculty assignment response invalid");
  expect(source).toContain("setBootstrapError(true)");
  expect(source).toContain("courseClassAssignments");
  expect(source).toContain("Could not load teacher course context");
  expect(source).toContain("Try again");
});

test("course home actions are guarded navigation rather than hidden mutations", () => {
  const source = read("src/pages/Dashboard/course/Home/Home.js");
  expect(source).toContain("routeToCourseTab");
  expect(source).toContain("disabled={!courseIdentifier}");
  expect(source).toContain("Retry signals");
  expect(source).not.toMatch(/createLessonContent|deleteLessonContent|updatePoints|publishGrade/);
});

test("course roster is read-only and has explicit load recovery", () => {
  const source = read("src/pages/Dashboard/course/Sudent/student.js");
  expect(source).toContain("We couldn't load the class roster");
  expect(source).toContain("Retry");
  expect(source).not.toMatch(/deleteStudent|updateStudent|removeStudent|createStudent/);
});

test("course discussion mutations preserve drafts, permissions and single-flight state", () => {
  const source = read("src/pages/Dashboard/course/Classroom/classroom.js");
  expect(source).toContain("postingRef");
  expect(source).toContain("messageMutationRef");
  expect(source).toContain("Discard your unsent discussion message?");
  expect(source).toContain("Delete this message?");
  expect(source).toContain("(isFacultyRole || isMine)");
  expect(source).toContain("{isFacultyRole && (");
  expect(source).toContain("disabled={mutationBusyId != null}");
  expect(source).toContain("Discussion refresh failed");
});
