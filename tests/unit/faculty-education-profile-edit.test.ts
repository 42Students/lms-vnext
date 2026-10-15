import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {newFacultyEducation} from "@/modules/people/faculty-profile-row-factories";
const id="10000000-0000-4000-8000-000000000001";
describe("Faculty education section",()=>{
 it("creates, updates and removes entries while preserving other sections",()=>{
  const row=[{...newFacultyEducation(),id,institutionName:"University",startYear:"2020",endYear:"2024"}];
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"education",value:row,expectedVersion:0,
  });
  expect(result.education[0]?.institutionName).toBe("University");
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
  expect(updateFacultyProfileSection(result,{
   section:"education",value:[],expectedVersion:1,
  }).education).toEqual([]);
 });
 it("rejects malformed entries and duplicate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"education",value:[{...newFacultyEducation(),id,institutionName:"University",startYear:"2025",endYear:"2024"}],expectedVersion:0,
  })).toThrow();
  const row=[{...newFacultyEducation(),id,institutionName:"University",startYear:"2020",endYear:"2024"}][0];
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"education",value:[row,row],expectedVersion:0,
  })).toThrow();
 });
});