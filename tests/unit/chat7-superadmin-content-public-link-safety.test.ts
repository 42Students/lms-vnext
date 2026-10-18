import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {safePublicCourseContentUrl} from "@/modules/courses/super-admin-content-public-link-model";

describe("SA-academics-people-62 imported content links fail closed",()=>{
 it("rejects passwords, userinfo, fragments and non-HTTPS schemes even from old persisted rows",()=>{
  for(const link of [null,undefined,"","javascript:alert(1)","http://school.invalid/a",
   "file:///tmp/notes.pdf","https://user:password@school.invalid/notes",
   "https://user@school.invalid/notes","https://school.invalid/notes#private","not-a-url"]){
   expect(safePublicCourseContentUrl(link)).toBeNull();
  }
  expect(safePublicCourseContentUrl("https://school.invalid/notes?week=2"))
   .toBe("https://school.invalid/notes?week=2");
 });
 it("keeps the content directory preview behind the same safe URL validation as authoring",()=>{
  const page=readFileSync(new URL("../../src/components/courses/super-admin-content-directory-page.tsx",import.meta.url),"utf8");
  expect(page).toContain("safePublicCourseContentUrl(value)");
  expect(page).toContain("<ThirdPartyLink href={publicHttpsHref(item.externalUrl)!}");
 });
});
