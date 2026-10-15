import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
describe("Faculty profile Social profiles section",()=>{
 it("validates and applies only the selected section",()=>{
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"socialProfiles",value:{...emptyFacultyProfileDocument.socialProfiles,github:"https://github.com/example"},expectedVersion:0,
  });
  expect(result.socialProfiles).toBeDefined();
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
 });
 it("rejects corrupt data without modifying the original",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"socialProfiles",value:{...emptyFacultyProfileDocument.socialProfiles,github:"javascript:alert(1)"},expectedVersion:0,
  })).toThrow();
  expect(emptyFacultyProfileDocument.about.description).toBe("");
 });
});
