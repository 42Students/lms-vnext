import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {newFacultyExperience} from "@/modules/people/faculty-profile-row-factories";
const id="10000000-0000-4000-8000-000000000002";
describe("Faculty experiences editor",()=>{
 it("preserves all other sections on add, edit and remove",()=>{
  const row=[{...newFacultyExperience(),id,organization:"College",from:"2023-01-01",to:"2025-01-01"}];
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"experiences",value:row,expectedVersion:0,
  });
  expect(result.experiences[0]?.organization).toBe("College");
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
  expect(updateFacultyProfileSection(result,{
   section:"experiences",value:[],expectedVersion:1,
  }).experiences).toHaveLength(0);
 });
 it("rejects invalid date chronology and duplicate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"experiences",value:[{...newFacultyExperience(),id,organization:"College",from:"2026-01-01",to:"2025-01-01"}],expectedVersion:0,
  })).toThrow();
  const row=[{...newFacultyExperience(),id,organization:"College",from:"2023-01-01",to:"2025-01-01"}][0];
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"experiences",value:[row,row],expectedVersion:0,
  })).toThrow();
 });
});