import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {assignmentFilesRuntimeEnabled} from "@/modules/courses/assignment-file-readiness";
const read=(p:string)=>readFileSync(p,"utf8");
describe("LEARNER-learning-misc-01 private upload readiness",()=>{
 it("LEARNER-learning-misc-01 does not claim private file upload is available without every R2 secret",()=>{
  const keys=["R2_ACCOUNT_ID","R2_ACCESS_KEY","R2_SECRET_KEY","R2_PRIVATE_BUCKET"] as const;
  const originals=keys.map(k=>process.env[k]);
  try{
   for(const k of keys)delete process.env[k];
   expect(assignmentFilesRuntimeEnabled()).toBe(false);
   for(let i=0;i<keys.length;i++){
    for(const k of keys)process.env[k]="fixture";
    delete process.env[keys[i]!];
    expect(assignmentFilesRuntimeEnabled()).toBe(false);
   }
  }finally{
   keys.forEach((k,i)=>{if(originals[i]===undefined)delete process.env[k];else process.env[k]=originals[i];});
  }
 });
 it("LEARNER-learning-misc-01 warns file-only learners of their actual blocker, not a disallowed text/link workaround",()=>{
  const ui=read("src/components/courses/assignment-submission-control.tsx");
  expect(ui).toContain('!fileUploadsEnabled&&mayUpload');
  expect(ui).toContain('role={!mayWrite&&!mayLink?"alert":"status"}');
  expect(ui).toContain("This assignment requires a PDF or file, but private uploads are unavailable.");
  expect(ui).toContain("Ask your Faculty or college administrator to enable private file storage.");
  expect(ui).toContain('disabled={!methodsLoaded || submitting ||');
  expect(ui).toContain("fileUploadsEnabled&&mayUpload");
 });
});