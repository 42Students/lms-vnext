import fs from "fs";
import path from "path";

const src = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/LectureHalls.js"), "utf8");

test("lecture halls distinguish failed loads from genuine empty lists", () => {
  expect(src).toMatch(/const \[loadError, setLoadError\] = useState\(""\)/);
  expect(src).toMatch(/message="Could not load lecture halls"/);
  expect(src).toMatch(/Could not load lecture halls; use Retry above/);
  expect(src).toMatch(/const \[departmentsError, setDepartmentsError\] = useState/);
  expect(src).toMatch(/Departments could not be loaded/);
});

test("lecture hall edit drafts require explicit discard and deletes are single-flight", () => {
  expect(src).toMatch(/originalEditRef/);
  expect(src).toMatch(/Discard edits to/);
  expect(src).toMatch(/Your unsaved changes will be lost/);
  expect(src).toMatch(/const \[deletingId, setDeletingId\] = useState\(null\)/);
  expect(src).toMatch(/if \(deletingId != null\) return/);
  expect(src).toMatch(/loading=\{deletingId === record\.id\}/);
});

test("required super-admin college options fail closed while optional department assignment stays recoverable", () => {
  expect(src).toMatch(/Colleges unavailable — Retry above/);
  expect(src).toMatch(/disabled=\{!collegeId && Boolean\(collegesError\)\}/);
  expect(src).toMatch(/Departments unavailable — Retry above/);
  expect(src).toMatch(/leave the optional department blank/);
});
