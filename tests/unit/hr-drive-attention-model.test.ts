import {describe,expect,it} from "vitest";
import {hrDriveAttention} from "@/modules/placements/hr-drive-attention-model";
import type {RecruiterDriveListItem} from "@/modules/placements/recruiter-drive-list-model";
const now=new Date("2026-10-15T10:00:00Z");
function row(id:string,collegeId:string,status:string,deadline:number|null,archivedAt:Date|null=null):RecruiterDriveListItem{
 return {collegeId,job:{id,title:id,status,archivedAt,
  applicationDeadline:deadline===null?null:new Date(now.getTime()+deadline)}};
}
describe("HR drive deadline attention",()=>{
 it("filters foreign college, archive, closed and missing deadlines",()=>{
  const rows=[row("due","a","PUBLISHED",86400000),row("past","a","PUBLISHED",-60000),
   row("foreign","b","PUBLISHED",86400000),row("closed","a","CLOSED",10000),
   row("archived","a","PUBLISHED",10000,now),row("unknown","a","PUBLISHED",null)];
  const result=hrDriveAttention(rows,"a",now);
  expect(result.soon.map(x=>x.job.id)).toEqual(["due"]);
  expect(result.past.map(x=>x.job.id)).toEqual(["past"]);
 });
 it("does not claim future distant deadlines are actionable",()=>{
  expect(hrDriveAttention([row("later","a","PUBLISHED",8*86400000)],"a",now).soon).toEqual([]);
 });
});
