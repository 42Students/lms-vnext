import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
const id="00000000-0000-4000-8000-000000000141", receipt="00000000-0000-4000-8000-000000000142";
describe("Faculty education private document receipt fence",()=>{
 it("rejects injecting an existing receipt on a newly submitted education record",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{section:"education",expectedVersion:0,
   value:[{id,institutionName:"University",certificateDocumentId:receipt}]})).toThrow();
 });
 it("accepts new education records with no receipt",()=>{
  expect(updateFacultyProfileSection(emptyFacultyProfileDocument,{section:"education",expectedVersion:0,
   value:[{id,institutionName:"University",certificateDocumentId:null}]}).education).toHaveLength(1);
 });
});
