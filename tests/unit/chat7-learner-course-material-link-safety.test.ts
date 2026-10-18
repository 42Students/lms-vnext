import {describe,expect,it} from "vitest";
import {
 facultyAssignmentMaterialLinkSchema,safeLearnerAssignmentMaterialLink,
} from "@/modules/courses/learner-assignment-materials-model";
import {
 selectLearnerAssignmentFile,
} from "@/modules/courses/learner-assignment-file-selection-model";

const delivery="11111111-1111-4111-8111-111111111111";
describe("LEARNER-ASSIGNMENT-MATERIALS-04 safe instructor references and file selection",()=>{
 it("only permits uncredentialed, fragment-free HTTPS external materials",()=>{
  const good={title:"Course reference",externalUrl:"https://university.example.edu/learn/unit1"};
  expect(facultyAssignmentMaterialLinkSchema.parse(good)).toEqual(good);
  expect(safeLearnerAssignmentMaterialLink(good.externalUrl)).toBe(good.externalUrl);
  for(const link of [
   "javascript:alert(1)","http://university.example.edu/",
   "https://user:secret@university.example.edu/",
   "https://university.example.edu/resource#internal",
   "https://localhost/admin","https://127.0.0.1/debug","https://[::1]/",
   "file:///etc/passwd","not a valid url",
  ]){
   expect(safeLearnerAssignmentMaterialLink(link)).toBeNull();
  }
 });
 it("does not permit clients to add private storage keys, tenant identities or arbitrary link fields",()=>{
  const payload={title:"Reference",externalUrl:"https://university.example.edu/notes",
   collegeId:delivery,storageKey:"private/other-college"};
  expect(facultyAssignmentMaterialLinkSchema.safeParse(payload).success).toBe(false);
  expect(facultyAssignmentMaterialLinkSchema.safeParse({title:"",externalUrl:payload.externalUrl}).success).toBe(false);
  expect(facultyAssignmentMaterialLinkSchema.safeParse({title:"x".repeat(161),externalUrl:payload.externalUrl}).success).toBe(false);
 });
 it("shows no selection error on a cleared file and does not attempt a signed upload",()=>{
  expect(selectLearnerAssignmentFile(delivery,null)).toEqual({file:null,error:null});
 });
 it("rejects an invalid delivery ID before preserving an untrusted chosen file",()=>{
  const file={name:"task.pdf",size:1024,type:"application/pdf"};
  const result=selectLearnerAssignmentFile("other-tenant",file);
  expect(result.file).toBeNull();
  expect(result.error).toBeTruthy();
 });
});
