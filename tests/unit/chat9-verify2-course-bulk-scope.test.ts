import {describe,it,expect} from "vitest";
import {courseBulkSelectionFilterKey} from "@/modules/courses/course-bulk-selection-scope-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=readFileSync(join(process.cwd(),"src/components/courses/super-admin-course-bulk-visibility.tsx"),"utf8");

describe("Super Admin course visibility and cross-page selection",()=>{
 it("keeps selection across pagination but clears it for different search/filter scope",()=>{
  const first=courseBulkSelectionFilterKey(new URLSearchParams("q=java&status=ACTIVE&page=1&pageSize=10").entries());
  const next=courseBulkSelectionFilterKey(new URLSearchParams("page=4&pageSize=50&status=ACTIVE&q=java").entries());
  expect(next).toEqual(first);
  expect(courseBulkSelectionFilterKey(new URLSearchParams("q=python&status=ACTIVE&page=1").entries())).not.toEqual(first);
  expect(courseBulkSelectionFilterKey(new URLSearchParams("q=java&status=ARCHIVED&page=1").entries())).not.toEqual(first);
  expect(source).toContain('const storageKey="lms:college-bulk-course-selection:"+collegeId');
 });
 it("uses legacy course-level visibility wording and preserves staff records",()=>{
  expect(source).toContain('>Visible to students</h3>');
  expect(source).toContain("Off hides the selected courses and their published lessons from students.");
  expect(source).toContain("The course records remain active for staff.");
  expect(source).toContain("COURSE_AND_PUBLISHED_CONTENT_VISIBILITY");
 });
 it("does not trust saved browser selections as authorized server IDs",()=>{
  expect(source).toContain("saved?.filterKey===filterKey");
  expect(source).toContain("safeLimit");
  expect(source).toContain('"/api/admin/courses/bulk-status"');
  expect(source).toContain('failedCourseIds');
 });
});
