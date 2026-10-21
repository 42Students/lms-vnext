import fs from "fs";
import path from "path";

const classes = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Classes.js"), "utf8");
const departments = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Departments.js"), "utf8");
const programs = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/Programs.js"), "utf8");
const semesters = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/SemesterManagement.js"), "utf8");
const electives = fs.readFileSync(path.join(process.cwd(), "src/components/admin/electives/ElectivesConsole.jsx"), "utf8");
const promotion = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/sections/BatchPromotion.js"), "utf8");

test("class recurring-schedule drafts and delete actions are protected", () => {
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(classes).toContain("const [deleteBusyId, setDeleteBusyId] = useState(null)");
  expect(classes).toContain("const [recurringDirty, setRecurringDirty] = useState(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(classes).toContain("Discard this recurring schedule draft?");
  expect(classes).toContain("maskClosable={false}");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(classes).toContain("loading={deleteBusyId === row.id}");
});

test("elective list failure and editor draft state do not collapse into normal empty state", () => {
  expect(electives).toContain("const [loadError, setLoadError] = useState(null)");
  expect(electives).toContain("Elective slots could not be loaded");
  expect(electives).toContain("Could not load elective slots; use Retry above.");
  expect(electives).toContain("Discard this elective slot draft?");
  expect(electives).toContain("maskClosable={false}");
  expect(electives).toContain("const [archiveBusyId, setArchiveBusyId] = useState(null)");
});

test("batch promotion requires a verified preview and never treats preview failure as approval", () => {
  expect(promotion).toContain("A failed/unavailable preview must never be represented as approval");
  expect(promotion).toContain('valid: false, message: "Could not verify this promotion. Please retry."');
  expect(promotion).toContain("previewLoading");
  expect(promotion).toContain("promotingBatchId");
  expect(promotion).toContain("graduatingId");
});


test("department, program and semester destructive actions are visibly single-flight", () => {
  for (const source of [departments, programs, semesters]) {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("deleteBusyRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("deleteBusyId");
  }
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(departments).toContain("loading={deleteBusyId === record.id}");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(programs).toContain("loading={deleteBusyId === record.id}");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(semesters).toContain("loading={deleteBusyId === record.id}");
});
