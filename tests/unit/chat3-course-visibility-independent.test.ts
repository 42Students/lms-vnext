import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {updateCourseInputSchema} from "@/modules/courses/validation";

describe("legacy course visibility is independent from enabled and archive lifecycle",()=>{
 it("accepts a visibility-only optimistic PATCH without mutating enabled",()=>{
  const token="2026-10-22T10:30:00.000Z";
  expect(updateCourseInputSchema.parse({expectedUpdatedAt:token,visibleToStudents:false}))
   .toEqual({expectedUpdatedAt:token,visibleToStudents:false});
  expect(updateCourseInputSchema.safeParse({expectedUpdatedAt:token,visibleToStudents:"false"}).success)
   .toBe(false);
  expect(updateCourseInputSchema.safeParse({expectedUpdatedAt:token,visibleToStudents:false,status:"ARCHIVED"}).success)
   .toBe(false);
 });
 it("maps only display permission in the dedicated switch and preserves history",()=>{
  const ui=readFileSync("src/components/courses/admin-course-visibility-control.tsx","utf8");
  const service=readFileSync("src/modules/courses/course-service.ts","utf8");
  expect(ui).toContain("visibleToStudents:next");
  expect(ui).not.toContain("enabled:next");
  expect(ui).toContain("Course display allowed, but this Course remains disabled.");
  expect(service).toContain("const { expectedUpdatedAt, visibleToStudents, ...changes } = input");
  expect(service).toContain("legacyAllowedForDisplay:visibleToStudents?1:0");
  expect(service).not.toContain("legacyAllowedForDisplay:input.enabled?1:0");
  expect(service).toContain("visibleToStudents!==undefined");
  expect(service).toContain('eq(courses.status, "ACTIVE")');
 });
});
