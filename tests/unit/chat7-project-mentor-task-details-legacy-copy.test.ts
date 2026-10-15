import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Mentor PR-S2-04 task details editor legacy strings",()=>{
 const source=readFileSync("src/components/projects/mentor-task-details-edit.tsx","utf8");
 it("matches TaskDetailsModal dev task field labels and final action",()=>{
  for(const label of ["Edit task","Title","Description","Done when (optional)","Priority",
    "Estimate","Type","Due","Blocker note","Save changes"]){
    expect(source).toContain(label);
  }
  expect(source).not.toContain(">Acceptance criteria (optional)");
  expect(source).not.toContain(">Blocker reason");
 });
 it("preserves four 0090 persisted task fields and optimistic write",()=>{
  for(const field of ["taskType:taskType||null","estimatePoints:estimate!==\"\"
     ?Number(estimate):null","dueDate:dueDate||null","blockerReason:blockerReason.trim()||null"]){
    expect(source.replace(/\s+/g,"")).toContain(field.replace(/\s+/g,""));
  }
 });
});
