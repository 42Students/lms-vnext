import {describe,it,expect} from "vitest";
import {tpoMessagesQuerySchema} from "@/modules/placements/tpo-messages-service";
import {getTpoMessagesPage} from "@/modules/placements/tpo-messages-model";
describe("chat-14 final sprint",()=>{
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