import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../../src/modules/projects/"+name,import.meta.url),"utf8");
describe("PR-S2-04 registered task metadata writes and blocker policy",()=>{
 it("persists all 0090 fields on mentor task creation",()=>{
   for(const field of ["blockerReason","dueDate","estimatePoints","taskType"])
     expect(read("mentor-task-create-service.ts")).toContain(field+":input."+field);
 });
 it("uses partial field updates on edit",()=>{
   for(const field of ["blockerReason","dueDate","estimatePoints","taskType"])
     expect(read("mentor-task-details-service.ts")).toContain("input."+field+"!==undefined");
 });
 it("rejects blocked transitions without recorded reason in both paths",()=>{
   for(const file of ["mentor-task-transition-service.ts","lifecycle-service.ts"]){
     expect(read(file)).toContain('status==="BLOCKED"');
     expect(read(file)).toContain("blockerReason?.trim()");
   }
 });
});