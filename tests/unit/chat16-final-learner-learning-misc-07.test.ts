import {describe,expect,it} from "vitest";
import {assignmentFileUploadRequestSchema,MAX_ASSIGNMENT_FILE_BYTES} from "@/modules/courses/assignment-file-validation";
import {validateStorageDeclaration,magicBytesMatch} from "@/modules/storage/file-policy";
const deliveryId="123e4567-e89b-42d3-a456-426614174001";
describe("LEARNER-learning-misc-07 safe file type decision",()=>{
 it("LEARNER-learning-misc-07 keeps private assignment files capped at 50 MiB and rejects active extensions",()=>{
  const base={deliveryId,originalName:"notes.py",contentType:"text/x-python",sizeBytes:128};
  for(const input of [
   base,{...base,originalName:"program.java",contentType:"text/x-java-source"},
   {...base,originalName:"notebook.ipynb",contentType:"application/x-ipynb+json"},
   {...base,originalName:"page.html",contentType:"text/html"},
   {...base,originalName:"vector.svg",contentType:"image/svg+xml"},
   {...base,originalName:"archive.7z",contentType:"application/x-7z-compressed"},
  ]){
   expect(assignmentFileUploadRequestSchema.safeParse(input).success).toBe(false);
   expect(validateStorageDeclaration("assignment-submission",input).ok).toBe(false);
  }
  expect(assignmentFileUploadRequestSchema.safeParse({...base,originalName:"notes.pdf",contentType:"application/pdf",sizeBytes:MAX_ASSIGNMENT_FILE_BYTES}).success).toBe(true);
  expect(assignmentFileUploadRequestSchema.safeParse({...base,originalName:"notes.pdf",contentType:"application/pdf",sizeBytes:MAX_ASSIGNMENT_FILE_BYTES+1}).success).toBe(false);
 });
 it("LEARNER-learning-misc-07 rejects declared PDF files with fake HTML content",()=>{
  expect(validateStorageDeclaration("assignment-submission",{
   originalName:"notes.pdf",contentType:"application/pdf",sizeBytes:100
  }).ok).toBe(true);
  expect(magicBytesMatch("application/pdf",new TextEncoder().encode("<html>test</html>"))).toBe(false);
  expect(magicBytesMatch("application/pdf",new TextEncoder().encode("%PDF-1.7"))).toBe(true);
 });
});