import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("verification decisions and settings are immediate single-flight and malformed success fails closed", () => {
  const source = read("src/components/verification/VerificationWorkspace.jsx");
  expect(source).toContain("const decisionRef = useRef(false)");
  expect(source).toContain("const settingRef = useRef(false)");
  expect(source).toContain("const studentRequestSeq = useRef(0)");
  expect(source).toContain("if (decisionRef.current) return");
  expect(source).toContain("if (settingRef.current) return");
  expect(source).toContain("!Array.isArray(r.data)");
  expect(source).toContain('typeof r.data?.tpoCanVerify !== "boolean"');
  expect(source).toContain('typeof r.data !== "object"');
});

test("verification document opens are single-flight", () => {
  const source = read("src/components/verification/VerificationWorkspace.jsx");
  expect(source).toContain("const busyRef = useRef(false)");
  expect(source).toContain("if (busyRef.current) return");
  expect(source).toContain("loading={busy} disabled={busy} onClick={open}");
});

test("admin calendars expose navigation/export/filter actions only", () => {
  const calendar = read("src/components/InterviewCalendar/InterviewCalendarContent.js");
  expect(calendar).toContain("fetchError");
  expect(calendar).toContain("onViewApplications");
  expect(calendar).toContain('exportRowsToCsv("interviews.csv"');
  expect(calendar).not.toMatch(/approveInterview|rejectInterview|deleteInterview|updateInterview/);
});

test("superadmin audit is read/filter/export only and failed load never becomes empty history", () => {
  const audit = read("src/pages/superadmin/sections/AuditLogs.js");
  expect(audit).toContain("Failed to load audit logs");
  expect(audit).toContain('emptyText: error ? "Audit logs could not be loaded"');
  expect(audit).toContain("handleExport");
  expect(audit).not.toMatch(/deleteAudit|updateAudit|createAudit/);
});

test("college and super admin verification/calendar pages reuse the shared hardened surfaces", () => {
  const collegeVerification = read("src/pages/college-admin/verification.js");
  const collegeCalendar = read("src/pages/college-admin/calendar.js");
  const superVerification = read("src/pages/superadmin/verification.js");
  const superCalendar = read("src/pages/superadmin/calendar.js");
  expect(collegeVerification).toContain("VerificationWorkspace");
  expect(collegeCalendar).toContain("InterviewCalendarContent");
  expect(superVerification).toContain("VerificationWorkspace");
  expect(superCalendar).toContain("InterviewCalendarContent");
});

// BE-0200: an unassigned College Admin gets the guard, not a calendar scoped by a URL collegeId.
test("college admin calendar ignores a collegeId in the address and guards the unassigned admin", () => {
  const page = read("src/pages/college-admin/calendar.js");
  expect(page).not.toContain("router.query?.collegeId");
  expect(page).toContain("loginUser?.collegeId ?? loginUser?.organizationId ?? null");
  expect(page).toContain("Admin not assigned to a college");
});
