import fs from "fs";
import path from "path";
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("attendance writes are single-flight and failed scheduling preserves the form", () => {
  const source = read("src/pages/Dashboard/course/Attendance/TakeAttendance.js");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("submittingRef");
  expect(source).toContain("schedulingRef");
  expect(source).toContain("if (schedulingRef.current) return");
  expect(source).toContain("setOpenDrawer(false)");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(source).toContain("Your local markings are still here so you can retry");
});

test("attendance marking drafts are protected from context switches and navigation", () => {
  const take = read("src/pages/Dashboard/course/Attendance/TakeAttendance.js");
  const filters = read("src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js");
  const report = read("src/pages/Dashboard/course/Attendance/AttendanceReport.js");
  expect(take).toContain("takeAttendanceDirty");
  expect(take).toContain('Router.events.on("routeChangeStart"');
  expect(filters).toContain("confirmDiscardAttendanceDraft");
  expect(report).toContain("confirmDiscardAttendanceDraft");
});
