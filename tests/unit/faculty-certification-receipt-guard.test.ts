import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
describe("Faculty certification receipt protection",()=>{
 it("rejects new forged certificate IDs",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
    section:"certifications",expectedVersion:0,value:[{id:"00000000-0000-4000-8000-000000000143",
      name:"Training",certificateDocumentId:"00000000-0000-4000-8000-000000000144"}]
  })).toThrow();
 });
});
