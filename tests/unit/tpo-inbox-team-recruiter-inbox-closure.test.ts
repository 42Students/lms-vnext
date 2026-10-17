import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {getTpoMessagesPage,summarizeTpoMessages,type TpoInboxRecord} from "@/modules/placements/tpo-messages-model";
import {formatTpoInboxTime} from "@/modules/placements/tpo-inbox-date-model";

const now=new Date("2099-06-16T07:00:00.000Z");
const records:TpoInboxRecord[]=[
 {id:"a",source:"RECRUITER_THREADS",participantName:"Asha",subject:"Drive 2028",
  status:"UNREAD",occurredAt:now,jobId:"job-a",messageCount:3,unreadCount:2,
  waitingForYou:true,companyName:"Example Ltd",lastPreview:"Please confirm the slots"},
 {id:"b",source:"RECRUITER_THREADS",participantName:"Bela",subject:"General recruiter conversation",
  status:"READ",occurredAt:new Date("2099-06-15T05:00:00.000Z"),jobId:null,messageCount:2,unreadCount:0,
  waitingForYou:false,companyName:"Other Co",lastPreview:"Thank you"},
];
const filters={status:"ALL" as const,q:"",from:null,to:null,page:1,pageSize:25};
describe("TPO recruiter inbox legacy acceptance",()=>{
 it("TPO-inbox-team-04 opens as a read acknowledgement using an explicit same-origin POST, not a GET mutation",()=>{
  const route=readFileSync(join(process.cwd(),
   "src/app/api/placements/tpo/messages/threads/[threadId]/read/route.ts"),"utf8");
  const reply=readFileSync(join(process.cwd(),"src/components/tpo/tpo-recruiter-message-reply.tsx"),"utf8");
  const detail=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/messages/[threadId]/page.tsx"),"utf8");
  expect(route).toContain("export async function POST");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("await listThreadMessages(context,id.data)");
  expect(reply).toContain('method:"POST"');
  expect(reply).toContain('"/read"');
  expect(detail).toContain("Seen");
 });
 it("TPO-inbox-team-05 filters recruiter last-response, previews and company names and counts the reply segment",()=>{
  expect(summarizeTpoMessages(records)).toMatchObject({total:2,unread:1,reply:1});
  const reply=getTpoMessagesPage(records,{...filters,status:"REPLY"});
  expect(reply.items.map(row=>row.id)).toEqual(["a"]);
  expect(getTpoMessagesPage(records,{...filters,q:"confirm"}).items.map(row=>row.id)).toEqual(["a"]);
  expect(getTpoMessagesPage(records,{...filters,q:"other co"}).items.map(row=>row.id)).toEqual(["b"]);
  expect(getTpoMessagesPage(records,{...filters,q:"x"}).total).toBe(2);
 });
 it("TPO-inbox-team-06 preserves company, last preview, Waiting for you and Access ended and IST relative dates",()=>{
  const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/messages/page.tsx"),"utf8");
  expect(page).toContain("item.companyName");
  expect(page).toContain("item.lastPreview");
  expect(page).toContain("item.waitingForYou");
  expect(page).toContain("item.accessEnded");
  expect(page).toContain("formatTpoInboxTime");
  expect(formatTpoInboxTime(now,now)).toMatch(/(?:AM|PM|am|pm)/);
  expect(formatTpoInboxTime(new Date("2099-06-15T07:00:00Z"),now)).toBe("Yesterday");
  expect(formatTpoInboxTime(new Date("2099-06-10T07:00:00Z"),now)).toBe("10 Jun");
 });
});
