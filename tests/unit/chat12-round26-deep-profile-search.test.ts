import {describe,it,expect} from "vitest";
import {tpoHiddenProfileMatchesSearch} from "@/modules/placements/tpo-hidden-profile-search";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("legacy roster quick search",()=>{
 it("TPO-students-25 matches phone, skills, institution and linked profiles server-side without returning their raw secrets",()=>{
  const doc={personalDetails:{mobileNumber:"9000012345"},skills:[{name:"Java 17"}],
   education:[{institutionName:"Sample School"}],socialProfiles:{githubUrl:"https://github.com/example"},
   identity:{aadhaarNumber:"123456789012"}};
  expect(tpoHiddenProfileMatchesSearch(doc,"90000123")).toBe(true);
  expect(tpoHiddenProfileMatchesSearch(doc,"java")).toBe(true);
  expect(tpoHiddenProfileMatchesSearch(doc,"sample")).toBe(true);
  expect(tpoHiddenProfileMatchesSearch(doc,"github.com")).toBe(true);
  expect(tpoHiddenProfileMatchesSearch(doc,"123456789012")).toBe(false);
  const service=src("src/modules/placements/tpo-students-service.ts");
  expect(service).toContain("hiddenSearchMatched:tpoHiddenProfileMatchesSearch");
  expect(src("src/modules/placements/tpo-students-model.ts")).toContain("if(row.hiddenSearchMatched)return true");
 });
 it("TPO-students-25 preserves q alias and updates typed search only after debounce",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain("first(raw.q)");
  expect(page).toContain("<TpoDebouncedStudentSearch");
  const input=src("src/components/tpo/tpo-debounced-student-search.tsx");
  expect(input).toContain("next.delete(\"q\")");
  expect(input).toContain("},350)");
  expect(input).toContain("router.replace(pathname");
 });
});
