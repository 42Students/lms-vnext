import fs from "fs";
import path from "path";
import glob from "glob";

const read = (rel) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

// A header college switch must not leave the last college's rows, selections, dialogs or late answers on screen. Each
// Super Admin section is keyed by the selected college, so a switch mounts it afresh (BE-0071, 0077, 0078, 0085, 0086,
// 0092, 0114, 0119, 0120, 0123, 0124, 0135, 0136, 0145, 0146, 0150, 0154, 0155, 0166, 0175, 0176, 0186, 0196, 0198).
test("every Super Admin section mounted with the selected college is keyed by it", () => {
  const pages = glob.sync("src/pages/superadmin/**/*.js", { cwd: process.cwd() }).filter((p) => !p.includes("/sections/"));
  const unkeyed = [];
  pages.forEach((p) => {
    const s = read(p);
    const mounts = s.match(/<\w+[^>]*collegeId=\{selectedCollegeId\}[^>]*>/g) || [];
    mounts.filter((m) => !/\bkey=/.test(m) && !m.startsWith("<Dashboard")).forEach((m) => unkeyed.push(`${p}: ${m}`));
  });
  expect(unkeyed).toEqual([]);
});

test("project pages that read the scope themselves remount per college (and per workspace)", () => {
  [
    "src/pages/superadmin/projects/workspaces/reassign-mentor.js",
    "src/pages/superadmin/projects/workspaces/index.js",
    "src/pages/superadmin/projects/submissions/index.js",
  ].forEach((p) => expect(read(p)).toMatch(/Body key=\{selectedCollegeId \?\? "none"\}/));
  ["team", "summary"].forEach((f) => expect(read(`src/pages/superadmin/projects/workspaces/[workspaceId]/${f}.js`)).toContain('Body key={`${selectedCollegeId ?? "none"}:${workspaceId ?? ""}`}'));
});

test("embedded lookups and drawers remount per college", () => {
  expect(read("src/pages/superadmin/sections/Jobs.js")).toContain("<StudentPlacementLookup key={selectedCollegeId}");
  expect(read("src/pages/superadmin/sections/DrivesLanding.js")).toContain('<StudentPlacementLookup key={collegeId ?? "none"}');
  expect(read("src/pages/superadmin/sections/ManageCollegeDrawer.js")).toContain('key={collegeId ?? "none"} // BE-0135/0136');
  expect(read("src/pages/superadmin/calendar.js")).toContain('key={selectedCollegeId ?? "none"} // BE-0198');
});

test("dynamic-route pages start afresh for each issue, drive or course (BE-0059, BE-0060, BE-0178, BE-0192)", () => {
  expect(read("src/pages/tracker/issues/[issueId].js")).toContain('<TrackerIssueDetailBody key={issueId ?? "none"} />');
  expect(read("src/pages/superadmin/jobs/[jobId]/index.js")).toContain('<SuperAdminDriveOverviewBody key={`${selectedCollegeId ?? "none"}:${jobId ?? ""}`} />');
  const course = read("src/pages/college-admin/courses/[id].js");
  expect(course).toContain("course.slug === id || String(course.id) === String(id)");
  expect(course).toContain("if (loading || !isThisCourse) {");
});

test("course tabs and the recruiter request form remount for a new course, section or source (BE-0153, BE-0207, BE-0208)", () => {
  const learn = read("src/pages/learn/courses/[courseId]/[...courseTab].js");
  expect(learn).toContain('<Syllabus key={String(courseId)} contentMode="roadmap" />');
  expect(learn).toContain("<Classroom key={String(courseId)} />");
  const teach = read("src/pages/teacher/courses/[courseId]/[...courseTab].js");
  expect(teach).toContain('<Syllabus key={`${courseId}:${router.query.cls ?? ""}`} contentMode="blueprint" />');
  expect(teach).toContain('<Classroom key={`${courseId}:${router.query.cls ?? ""}`} />');
  expect(read("src/pages/recruiter/drives/new.js")).toContain('<RecruiterRequestDriveBody key={`${fix ?? ""}:${from ?? ""}:${edit ?? ""}`} />');
});
