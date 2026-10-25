import {describe,it,expect} from "vitest";
import {readRecruiterUploadEnvelope,RecruiterUploadTooLargeError}
 from "@/modules/placements/recruiter-upload-size-model";
describe("Recruiter Excel multipart stream limits",()=>{
 it("accepts a bounded upload even without Content-Length",async()=>{
  const data=new Uint8Array(150);
  data.set([4,8,15,16],0);
  const req=new Request("https://lms.invalid/upload",{
   method:"POST",body:new Blob([data]),
  });
  expect(Array.from(await readRecruiterUploadEnvelope(req,200))).toEqual(Array.from(data));
 });
 it("fails closed before parsing a large streamed request",async()=>{
  const req=new Request("https://lms.invalid/upload",{
   method:"POST",body:new Blob([new Uint8Array(110)]),
  });
  await expect(readRecruiterUploadEnvelope(req,100))
    .rejects.toBeInstanceOf(RecruiterUploadTooLargeError);
 });
 it("does not assume that an empty body is an authorized Excel file",async()=>{
  const req=new Request("https://lms.invalid/upload",{method:"POST"});
  expect((await readRecruiterUploadEnvelope(req)).byteLength).toBe(0);
 });
});
