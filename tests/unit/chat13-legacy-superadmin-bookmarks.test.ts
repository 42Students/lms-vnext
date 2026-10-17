import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {legacySuperAdminDestination} from "@/modules/admin-ui/legacy-superadmin-destination-model";
describe("Legacy Super Admin bookmark continuity",()=>{
 it("SA-academics-people-R03 redirects all ten Academic Setup pages",()=>{
  for(const slug of ["departments","programs","semesters","semester-courses","batches",
   "classes","batch-promotion","lecture-halls","electives","attendance"])
   expect(legacySuperAdminDestination([slug])).toMatch(/^\/admin\//);
 });
 it("SA-academics-people-R03 redirects people, courses, placements and legacy lesson-content types",()=>{
  expect(legacySuperAdminDestination(["teachers"])).toBe("/admin/faculty");
  expect(legacySuperAdminDestination(["recruiters"])).toBe("/admin/recruiters");
  expect(legacySuperAdminDestination(["lesson-content"],"video")).toBe("/admin/videos");
  expect(legacySuperAdminDestination(["lesson-content"],"resources")).toBe("/admin/resources");
  expect(legacySuperAdminDestination(["lesson-content"],"live-classes")).toBe("/admin/live-classes");
  expect(legacySuperAdminDestination(["course-progress"])).toBe("/admin/course-progress");
 });
 it("SA-academics-people-R03 never routes unknown or nested IDs",()=>{
  expect(legacySuperAdminDestination(["unknown"])).toBeNull();
  expect(legacySuperAdminDestination(["students","someone-else"])).toBeNull();
  expect(legacySuperAdminDestination(["lesson-content"],"script")).toBeNull();
  const route=readFileSync("src/app/(authenticated)/superadmin/[...legacy]/page.tsx","utf8");
  expect(route).toContain("isSuperAdmin(context)");
  expect(route).toContain("notFound()");
 });
});
