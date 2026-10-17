import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
const proven=[
 {id:"SA-placements-projects-39",test:"tests/unit/chat13-recruiter-activity-audit.test.ts"},
 {id:"SA-academics-people-31",test:"tests/unit/chat13-academic-attendance-policy.test.ts"},
 {id:"SA-academics-people-39",test:"tests/unit/chat13-academic-existing-routes.test.ts"},
] as const;
describe("Chat 13 formerly unconfirmed source-backed gaps",()=>{
 const queue=read("docs/orchestrator/queues/gap-closure-chat-13.md");
 for(const {id,test} of proven){
  it(id+" is represented by an existing named behavior test",()=>{
   expect(read(test)).toContain(id);
   expect(queue).toContain("| "+id+" |");
   expect(queue).not.toContain("| "+id+" | S3 | STATE | UNCONFIRMED |");
  });
 }
});
