import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/Dashboard/course/syllabus/syllabus.js"),
  "utf8"
);

test("lesson request failure has a retryable error state instead of the genuine empty-course state", () => {
  expect(src).toMatch(/const \[lessonsLoadError, setLessonsLoadError\] = useState\(null\)/);
  expect(src).toMatch(/message="Could not load course lessons"/);
  expect(src).toMatch(/description=\{lessonsLoadError\}/);
  expect(src).toMatch(/setRefresh\(\(value\) => !value\)/);
});

test("auxiliary roadmap sources expose partial state instead of silently disappearing", () => {
  expect(src).toMatch(/const \[roadmapQuizError, setRoadmapQuizError\] = useState\(false\)/);
  expect(src).toMatch(/const \[submittedAssignmentsError, setSubmittedAssignmentsError\] = useState\(false\)/);
  expect(src).toMatch(/const \[progressLoadError, setProgressLoadError\] = useState\(false\)/);
  expect(src).toMatch(/message="Some course state could not be loaded"/);
  expect(src).toMatch(/Retry state/);
  expect(src).not.toMatch(/catch\(err => \{[\s\S]{0,180}setRoadmapQuizItems\(\[\]\)/);
});
