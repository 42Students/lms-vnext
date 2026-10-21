import fs from "fs";
import path from "path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/tpo/StudentPanel.js"),
  "utf8"
);

test("TPO Student 360 exposes stale refresh state instead of silently showing old data as current", () => {
  expect(src).toMatch(/message="Student details may be stale"/);
  expect(src).toMatch(/description=\{loadError\}/);
  expect(src).toMatch(/action=\{<Button size="small" onClick=\{load\}>Retry<\/Button>\}/);
});

test("private notes are protected across close and previous-next navigation", () => {
  expect(src).toMatch(/Discard this private note\?/);
  expect(src).toMatch(/onClose=\{\(\) => confirmDiscardNoteThen\(onClose\)\}/);
  expect(src).toMatch(/confirmDiscardNoteThen\(onPrev\)/);
  expect(src).toMatch(/confirmDiscardNoteThen\(onNext\)/);
});

test("student-panel mutations are single-flight and reconcile important state before refresh", () => {
  expect(src).toMatch(/if \(!note\.trim\(\) \|\| noteSavingRef\.current\) return/);
  expect(src).toMatch(/if \(registrationSavingRef\.current\) return false/);
  expect(src).toMatch(/if \(!d\?\.id \|\| liftingRef\.current\) return/);
  expect(src).toMatch(/setData\(\(current\) => current \? \{ \.\.\.current, row: current\.row \? \{ \.\.\.current\.row, registration: choice/);
  expect(src).toMatch(/liftedAt: new Date\(\)\.toISOString\(\)/);
});
