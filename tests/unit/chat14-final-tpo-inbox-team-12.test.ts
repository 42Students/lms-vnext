import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoMessagesQuerySchema} from "@/modules/placements/tpo-messages-service";
import {getTpoMessagesPage} from "@/modules/placements/tpo-messages-model";
describe("chat-14 final sprint",()=>{
 it("TPO-inbox-team-12 filters authorized recruiter conversations in SQL before page retrieval",()=>{
  const code=readFileSync("src/modules/placements/tpo-messages-sql-page-service.ts","utf8");
  expect(code).toContain("where t.college_id=");
  expect(code).toContain("limit ${query.pageSize} offset ${(query.page-1)*query.pageSize}");
  expect(code).toContain("count(*)::int as count from");
  expect(code).toContain("order by f.occurred_at desc,f.id asc");
  expect(code).toContain("f.status=");
  expect(code).toContain("f.body_match=true");
  expect(code).toContain("last_preview");
 });
 it("TPO-inbox-team-12 returns SQL page and full-college summary without materializing all conversations",()=>{
  const service=readFileSync("src/modules/placements/tpo-messages-service.ts","utf8");
  expect(service).toContain("getTpoRecruiterThreadSqlPage(collegeId,query)");
  expect(service).not.toContain("await loadRecruiterThreads(");
  expect(service).toContain("loadTpoPlacementNotifications(collegeId)");
 });

 it("TPO-inbox-team-12 caps page size and correctly slices authorized sorted thread records",()=>{
  expect(tpoMessagesQuerySchema.safeParse({pageSize:101}).success).toBe(false);
  const records=Array.from({length:31},(_,i)=>({
    id:String(i).padStart(3,"0"),source:"RECRUITER_THREADS" as const,participantName:"Recruiter",
    subject:"Subject",status:"READ" as const,occurredAt:new Date(2099,0,31-i),
    jobId:null,messageCount:1,unreadCount:0,
  }));
  const result=getTpoMessagesPage(records,{status:"ALL",q:"",from:null,to:null,page:2,pageSize:10});
  expect(result.total).toBe(31);
  expect(result.items).toHaveLength(10);
  expect(result.page).toBe(2);
 });
});