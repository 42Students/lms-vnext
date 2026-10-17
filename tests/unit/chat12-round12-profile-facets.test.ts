import {describe,it,expect} from "vitest";
import {tpoStudentProfileFacts} from "@/modules/placements/tpo-student-profile-facts";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO Students restored profile filters and visible labels",()=>{
 it("TPO-students-22 derives resume and coding profile presence without exposing identifiers",()=>{
  const found=tpoStudentProfileFacts({resumeDocumentId:"receipt-123",socialProfiles:{leetcodeUrl:"https://leetcode.com/u/test"}});
  expect(found.resume).toBe(true);
  expect(found.codingProfiles).toBe(true);
  expect(tpoStudentProfileFacts({}).resume).toBe(false);
  expect(tpoStudentUrlError({hasResume:"YES",hasCodingProfiles:"NO"})).toBeNull();
  const s=src("src/modules/placements/tpo-students-service.ts");
  expect(s).toContain("hasResume:yesNo.optional()");
  expect(s).toContain("hasCodingProfiles:yesNo.optional()");
 });
 it("TPO-students-29 shows non-sensitive resume and coding-profile presence in the roster",()=>{
  const grid=src("src/components/tpo/tpo-students-spreadsheet.tsx");
  expect(grid).toContain('key:"resume",label:"Resume"');
  expect(grid).toContain('key:"codingProfiles",label:"Coding profiles"');
 });
 it("TPO-students-46 retains only the primary import in the header and discloses ancillary tools",()=>{
  const p=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(p).toContain("actions={manageAllowed?<TpoAcademicImportWorkspace />:undefined}");
  expect(p).not.toContain('eyebrow="TPO · Students"');
  expect(p).toContain("More student tools");
 });
 it("TPO-students-24 supports profile facets through both query and filter controls",()=>{
  const p=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(p).toContain('name={key} defaultValue={query[key]===undefined?"":query[key]?"YES":"NO"}');
  expect(src("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain('urlKey:"hasCodingProfiles"');
 });
});
