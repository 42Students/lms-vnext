import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/Global/Offcanvas/Assignment/newAssignment.js"),
  "utf8"
);

test("assignment editor protects unsaved drafts on every close path", () => {
  expect(src).toMatch(/const \[dirty, setDirty\] = useState\(false\)/);
  expect(src).toMatch(/const requestClose = \(\) => \{/);
  expect(src).toMatch(/Discard this assignment draft\?/);
  expect(src).toMatch(/onClose=\{requestClose\}/);
  expect(src).toMatch(/onClickPrimary=\{requestClose\}/);
  expect(src).toMatch(/onValuesChange=\{\(\) => setDirty\(true\)\}/);
});

test("assignment editor distinguishes course and lesson source failures from empty selectors", () => {
  expect(src).toMatch(/const \[coursesError, setCoursesError\] = useState\(null\)/);
  expect(src).toMatch(/message="Could not load courses"/);
  expect(src).toMatch(/const \[lessonsError, setLessonsError\] = useState\(null\)/);
  expect(src).toMatch(/message="Could not load lessons"/);
  expect(src).toMatch(/placeholder=\{lessonsLoading \? "Loading lessons…" : lessonsError \? "Lessons unavailable"/);
});

test("assignment create and update are single-flight", () => {
  expect(src).toMatch(/const submitAttemptRef = useRef\(false\)/);
  expect(src).toMatch(/if \(saving \|\| submitAttemptRef\.current\) return/);
  expect(src).toMatch(/submitAttemptRef\.current = true/);
  expect(src).toMatch(/disableSecondary=\{isUploading \|\| saving/);
  expect(src).toMatch(/submitAttemptRef\.current = false;\s*setSaving\(false\)/);
});
