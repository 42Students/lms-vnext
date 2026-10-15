import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {newFacultyLanguage} from "@/modules/people/faculty-profile-row-factories";
const id="10000000-0000-4000-8000-000000000001";
describe("Faculty languages section",()=>{
 it("creates, updates and removes entries while preserving other sections",()=>{
  const row=[{id,language:"Telugu",proficiency:"Fluent"}];
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"languages",value:row,expectedVersion:0,
  });
  expect(result.languages[0]?.language).toBe("Telugu");
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
  expect(updateFacultyProfileSection(result,{
   section:"languages",value:[],expectedVersion:1,
  }).languages).toEqual([]);
 });
 it("rejects malformed entries and duplicate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"languages",value:[{id,language:"",proficiency:"Fluent"}],expectedVersion:0,
  })).toThrow();
  const row=[{id,language:"Telugu",proficiency:"Fluent"}][0];
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"languages",value:[row,row],expectedVersion:0,
  })).toThrow();
 });
});