import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
describe("Faculty profile Address section",()=>{
 it("validates and applies only the selected section",()=>{
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"address",value:{...emptyFacultyProfileDocument.address,currentCity:"Vijayawada"},expectedVersion:0,
  });
  expect(result.address).toBeDefined();
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
 });
 it("rejects corrupt data without modifying the original",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"address",value:{currentCity:123},expectedVersion:0,
  })).toThrow();
  expect(emptyFacultyProfileDocument.about.description).toBe("");
 });
});
