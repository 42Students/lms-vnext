import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {newFacultyAward} from "@/modules/people/faculty-profile-row-factories";
const id="10000000-0000-4000-8000-000000000003";
describe("Faculty awards editor",()=>{
 it("creates and removes scoped entries without affecting other sections",()=>{
  const row=[{...newFacultyAward(),id,title:"Excellence in Teaching",year:"2026"}];
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"awards",value:row,expectedVersion:0,
  });
  expect(result.awards[0]?.title).toBe("Excellence in Teaching");
  expect(result.skills).toEqual([]);
  expect(updateFacultyProfileSection(result,{
   section:"awards",value:[],expectedVersion:1,
  }).awards).toHaveLength(0);
 });
 it("rejects malformed entries and duplicate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"awards",value:[{...newFacultyAward(),id,title:"",year:"2026"}],expectedVersion:0,
  })).toThrow();
  const row=[{...newFacultyAward(),id,title:"Excellence in Teaching",year:"2026"}][0];
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"awards",value:[row,row],expectedVersion:0,
  })).toThrow();
 });
});