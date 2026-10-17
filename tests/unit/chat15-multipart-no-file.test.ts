import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {allowedAssignmentMixedParts} from "@/modules/courses/assignment-method-policy";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("chat-15 one-shot mixed learner submissions",()=>{
 const methods=["WRITTEN_RESPONSE","REPOSITORY_LINK","EXTERNAL_LINK","FILE_UPLOAD"] as const;
 it("LEARNER-learning-misc-04 accepts text and link as a combined submission without fabricated file",()=>{
  expect(allowedAssignmentMixedParts(methods,{
   hasWrittenResponse:true,links:[{kind:"REPOSITORY_LINK"}],fileMimeTypes:[],
  })).toBe(true);
  expect(allowedAssignmentMixedParts(methods,{
   hasWrittenResponse:true,links:[],fileMimeTypes:[],
  })).toBe(true);
  expect(allowedAssignmentMixedParts(methods,{
   hasWrittenResponse:false,links:[{kind:"EXTERNAL_LINK"}],fileMimeTypes:[],
  })).toBe(true);
  expect(allowedAssignmentMixedParts(methods,{
   hasWrittenResponse:false,links:[],fileMimeTypes:[],
  })).toBe(false);
  expect(allowedAssignmentMixedParts(["WRITTEN_RESPONSE"],{
   hasWrittenResponse:false,links:[{kind:"EXTERNAL_LINK"}],fileMimeTypes:[],
  })).toBe(false);
 });
 it("LEARNER-learning-misc-04 keeps verified file, written and link parts in one transaction",()=>{
  const server=source("src/modules/courses/assignment-submission-file-service.ts");
  expect(server).toContain('value.fileIds.length>0 || Boolean(value.textContent?.trim()) || value.links.length>0');
  expect(server).toContain('await tx.insert(assignmentSubmissionLinks)');
  expect(server).toContain('const bound: FileRow[] = []');
  expect(server).toContain('allowedAssignmentMixedParts(policy.methods');
  const ui=source("src/components/courses/assignment-file-submission-control.tsx");
  expect(ui).toContain('staged.length||hasWrittenOrLinkParts');
  expect(ui).toContain('!confirmed || (files.length===0&&!hasWrittenOrLinkParts)');
  expect(ui).toContain('fileIds:readySubmissionFileIds(files)');
  expect(source("src/components/courses/assignment-submission-control.tsx"))
    .toContain('multipartEnabled?"Combine work":"File Upload"');
 });
});
