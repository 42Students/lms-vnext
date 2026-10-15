import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {newFacultyCertification} from "@/modules/people/faculty-profile-row-factories";
const id="10000000-0000-4000-8000-000000000002";
describe("Faculty certifications editor",()=>{
 it("preserves all other sections on add, edit and remove",()=>{
  const row=[{...newFacultyCertification(),id,name:"Teaching Certificate",certificationDate:"2025-01-01",validityDate:"2028-01-01"}];
  const result=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"certifications",value:row,expectedVersion:0,
  });
  expect(result.certifications[0]?.name).toBe("Teaching Certificate");
  expect(result.about).toEqual(emptyFacultyProfileDocument.about);
  expect(updateFacultyProfileSection(result,{
   section:"certifications",value:[],expectedVersion:1,
  }).certifications).toHaveLength(0);
 });
 it("rejects invalid date chronology and duplicate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"certifications",value:[{...newFacultyCertification(),id,name:"Teaching Certificate",certificationDate:"2028-01-01",validityDate:"2027-01-01"}],expectedVersion:0,
  })).toThrow();
  const row=[{...newFacultyCertification(),id,name:"Teaching Certificate",certificationDate:"2025-01-01",validityDate:"2028-01-01"}][0];
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"certifications",value:[row,row],expectedVersion:0,
  })).toThrow();
 });
});