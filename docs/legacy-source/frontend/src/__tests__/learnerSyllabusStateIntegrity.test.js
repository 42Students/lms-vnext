import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("full lesson detail keeps load failure distinct from genuine empty content", () => {
  const source = read("src/pages/Dashboard/course/syllabus/syllabusDetail.js");
  expect(source).toContain("lessonContentLoadError");
  expect(source).toContain("Lesson content could not be loaded");
  expect(source).toContain("Lesson content may be out of date");
  expect(source).toContain("loadedLessonKeyRef");
  expect(source).toContain("if (replacingIdentity) setLessonContentData([])");
});

test("completion and assignment state failures do not become false incomplete states", () => {
  const source = read("src/pages/Dashboard/course/syllabus/syllabusDetail.js");
  const cards = read("src/components/Course/Syllabus/LessonActivityCards.jsx");
  expect(source).toContain("progressLoadError");
  expect(source).toContain("submittedAssignmentsError");
  expect(source).toContain("Lesson completion state could not be fully verified");
  expect(source).toContain("progressUnavailable={progressLoadError}");
  expect(source).toContain("submissionStateUnknown={submittedAssignmentsError}");
  expect(cards).toContain("Submission status unavailable");
  expect(cards).toContain('submissionStateUnknown ? "Open assignment"');
});

test("mark-complete is single-flight and fails closed while progress state is unknown", () => {
  const source = read("src/components/Course/Syllabus/MarkCompleteButton.jsx");
  expect(source).toContain("const savingRef = useRef(false)");
  expect(source).toContain("if (disabled || savingRef.current) return");
  expect(source).toContain("savingRef.current = true");
  expect(source).toContain("savingRef.current = false");
  expect(source).toContain("disabled={disabled || saving}");
});

test("submission/progress caches are scoped to the current learner and lesson", () => {
  const source = read("src/pages/Dashboard/course/syllabus/syllabusDetail.js");
  expect(source).toContain("submittedLearnerIdRef");
  expect(source).toContain("loadedProgressKeyRef");
  expect(source).toContain('const progressKey = `${loginUser?.id ?? "learner"}:${lessonId}`');
});
