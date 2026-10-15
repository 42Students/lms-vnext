import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {newFacultyPublication} from "@/modules/people/faculty-profile-row-factories";
const id="10000000-0000-4000-8000-000000000003";
describe("Faculty publications editor",()=>{
 it("creates and removes scoped entries without affecting other sections",()=>{
  const row=[{...newFacultyPublication(),id,title:"Research article",year:"2025",link:"https://example.org/publication"}];
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"publications",value:row,expectedVersion:0,
  });
  expect(result.publications[0]?.title).toBe("Research article");
  expect(result.skills).toEqual([]);
  expect(updateFacultyProfileSection(result,{
   section:"publications",value:[],expectedVersion:1,
  }).publications).toHaveLength(0);
 });
 it("rejects malformed entries and duplicate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"publications",value:[{...newFacultyPublication(),id,title:"Research article",year:"202x"}],expectedVersion:0,
  })).toThrow();
  const row=[{...newFacultyPublication(),id,title:"Research article",year:"2025",link:"https://example.org/publication"}][0];
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"publications",value:[row,row],expectedVersion:0,
  })).toThrow();
 });
});