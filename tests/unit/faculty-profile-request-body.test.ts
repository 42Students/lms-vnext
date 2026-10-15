import {describe,expect,it} from "vitest";
import {FacultyProfileBodyTooLarge,FACULTY_PROFILE_MAX_REQUEST_BYTES,readBoundedFacultyProfileJson} from "@/modules/people/faculty-profile-request-body";
describe("Faculty private profile PATCH bounded request",()=>{
 it("parses valid section edits",async()=>{
  const request=new Request("https://app.test",{
   method:"PATCH",body:JSON.stringify({section:"about",value:{description:"Teaching"},expectedVersion:0}),
  });
  await expect(readBoundedFacultyProfileJson(request)).resolves.toMatchObject({section:"about"});
 });
 it("rejects bodies over one MiB even without Content-Length",async()=>{
  const request=new Request("https://app.test",{
   method:"PATCH",body:JSON.stringify({section:"about",value:{description:"x".repeat(FACULTY_PROFILE_MAX_REQUEST_BYTES)}}),
  });
  await expect(readBoundedFacultyProfileJson(request)).rejects.toBeInstanceOf(FacultyProfileBodyTooLarge);
 });
 it("rejects malformed JSON",async()=>{
  await expect(readBoundedFacultyProfileJson(new Request("https://app.test",{method:"PATCH",body:"{"}))).rejects.toBeInstanceOf(SyntaxError);
 });
});
