import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
const id="00000000-0000-4000-8000-000000000145";
describe("Faculty experience private documents",()=>{
 it("rejects offer letter and experience certificate injection",()=>{
  for(const field of ["experienceCertificateDocumentId","offerLetterDocumentId"]){
    expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
     section:"experiences",expectedVersion:0,value:[{id,organization:"College",[field]:"00000000-0000-4000-8000-000000000146"}]
    })).toThrow();
  }
 });
});
