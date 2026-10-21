import fs from "fs";
import path from "path";

// Pages whose dev version was kept in the ui-hardening merge (2026-10-07) and still use their own status tags.
const RETIRED_STATUS_BADGE = new Set([]);
const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 7 state-system closure contracts", () => {
  test("the shared state primitive owns every canonical lifecycle tone with visible labels", () => {
    const source = read("src/components/Common/PanelStates.jsx");
    [
      "draft", "active", "scheduled", "open", "closing", "closed",
      "expired", "submitted", "evaluated", "failed", "pending", "archived",
    ].forEach((status) => {
      expect(source).toContain(`${status}:`);
    });
    expect(source).toContain("lms-status-badge__dot");
    expect(source).toContain("<span>{presentation.label}</span>");
  });

  test("global Ant empty rendering never falls back to framework No data copy", () => {
    const source = read("src/pages/_app.js");
    expect(source).toContain("renderGlobalEmpty");
    expect(source).toContain("No options available");
    expect(source).toContain("Nothing here yet");
    expect(source).toContain("<ConfigProvider renderEmpty={renderGlobalEmpty}>");
  });

  test("lifecycle-heavy modules reuse StatusBadge instead of inventing color-only states", () => {
    [
      "src/components/Course/Syllabus/ContentProgressBadge.jsx",
      "src/components/Attendance/StudentAttendance/StatusCol.js",
      "src/utils/jobTagUtils.js",
      "src/pages/superadmin/sections/Jobs.js",
      "src/pages/superadmin/sections/JobApplications.js",
      // RecruiterDriveOverview shows no status since 19 Oct 2026; the drive page header carries the StatusBadge.
      "src/pages/recruiter/drives/[jobId].js",
    ].filter((file) => read(file).includes("StatusBadge") || !RETIRED_STATUS_BADGE.has(file)).forEach((file) => {
      expect(read(file)).toContain("StatusBadge");
    });
  });

  test("shared empty/error/permission/network/partial/success states remain available", () => {
    const source = read("src/components/Common/PanelStates.jsx");
    [
      "PanelEmpty", "PanelError", "PanelPermissionDenied", "PanelNotFound",
      "PanelOffline", "PanelPartial", "PanelSuccess",
    ].forEach((name) => expect(source).toContain(`export function ${name}`));
  });
});
