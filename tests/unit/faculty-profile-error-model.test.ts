import {describe,expect,it} from "vitest";
import {facultyProfileNeedsReload,facultyProfileSaveFailure} from "@/modules/people/faculty-profile-error-model";
describe("Faculty profile optimistic conflict recovery",()=>{
 it("offers explicit reload only for a verified stale version",()=>{
  expect(facultyProfileNeedsReload("FACULTY_PROFILE_VERSION_CONFLICT")).toBe(true);
  expect(facultyProfileNeedsReload("PRIVATE_IDENTITY_STORAGE_NOT_READY")).toBe(false);
  expect(facultyProfileSaveFailure("FACULTY_PROFILE_VERSION_CONFLICT",409)).toContain("Reload");
 });
 it("explains oversized requests without reflecting arbitrary server text",()=>{
  expect(facultyProfileSaveFailure("REQUEST_TOO_LARGE",413)).toContain("too large");
  expect(facultyProfileSaveFailure("<script>alert(1)</script>",500)).not.toContain("<script>");
 });
});
