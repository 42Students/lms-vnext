import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
describe("Faculty profile Personal details section",()=>{
 it("validates and applies only the selected section",()=>{
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"personalDetails",value:{gender:"Female",dateOfBirth:"2000-02-29",bloodGroup:"O+"},expectedVersion:0,
  });
  expect(result.personalDetails).toBeDefined();
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
 });
 it("rejects corrupt data without modifying the original",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"personalDetails",value:{gender:"",dateOfBirth:"2026-02-30",bloodGroup:""},expectedVersion:0,
  })).toThrow();
  expect(emptyFacultyProfileDocument.about.description).toBe("");
 });
});
