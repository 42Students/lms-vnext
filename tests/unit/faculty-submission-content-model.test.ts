import { describe, expect, it } from "vitest";
import { facultySubmissionContentView } from "@/modules/courses/faculty-submission-content-model";
const id="10000000-0000-4000-8000-000000000001";
const input={id,submissionType:"TEXT",textContent:"A\n B",submissionUrl:null};
describe("Faculty submission review content", () => {
 it("preserves submitted text and explains missing content", () => {
  expect(facultySubmissionContentView(input,false)).toEqual({kind:"TEXT",text:"A\n B"});
  expect(facultySubmissionContentView({...input,textContent:null},false).kind).toBe("UNAVAILABLE");
 });
 it("uses only the authenticated file endpoint and respects runtime readiness", () => {
  const file={...input,submissionType:"FILE",textContent:null};
  expect(facultySubmissionContentView(file,true)).toMatchObject({kind:"FILE",href:"/api/courses/assignment-submissions/"+id+"/file"});
  expect(facultySubmissionContentView(file,false).kind).toBe("UNAVAILABLE");
  expect(()=>facultySubmissionContentView({...file,id:"../foreign"},true)).toThrow();
  expect(()=>facultySubmissionContentView({...file,objectKey:"private/foreign"},true)).toThrow();
 });
 it("does not offer executable, credentialed, missing or insecure stored links", () => {
  for(const submissionUrl of [null,"javascript:alert(1)","http://example.test","https://user:pass@example.test","/private/file"])
   expect(facultySubmissionContentView({...input,submissionType:"LINK",submissionUrl},false).kind).toBe("UNAVAILABLE");
  expect(facultySubmissionContentView({...input,submissionType:"LINK",submissionUrl:"https://example.test/work"},false)).toMatchObject({kind:"LINK",href:"https://example.test/work"});
 });
});
