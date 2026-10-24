import {describe,expect,it} from "vitest";
import {mentorAttentionReceiptKey,mentorAnnouncementReceiptKey,
  mentorUnreadAttentionCount} from
  "@/modules/projects/mentor-attention-read-model";

const alert=(revision?:string)=>({
  key:"task-review:t-1",projectId:"project-1",kind:"TASK_REVIEW" as const,
  occurredAt:"2026-10-22T10:00:00.000Z",revision,
  title:"Review task",description:"Review",href:"/mentor/projects/project-1?tab=board",
});
const notice={id:"announcement-1",createdAt:new Date("2026-10-22T00:00:00Z")};
describe("Mentor durable source notification read identity",()=>{
 it("is stable across refreshes for the same source revision",()=>{
   expect(mentorAttentionReceiptKey(alert("v2"))).toBe(
     mentorAttentionReceiptKey({...alert("v2"),title:"Updated UI wording"}));
   expect(mentorAnnouncementReceiptKey(notice)).toBe(
     mentorAnnouncementReceiptKey({id:notice.id,createdAt:notice.createdAt.toISOString()}));
 });
 it("reopens an alert when its underlying task-set version changes",()=>{
   const earlier=mentorAttentionReceiptKey(alert("v1"));
   const newer=mentorAttentionReceiptKey(alert("v2"));
   expect(earlier).not.toBe(newer);
   expect(mentorUnreadAttentionCount([alert("v2")],[notice],
     new Set([earlier,mentorAnnouncementReceiptKey(notice)]))).toBe(1);
 });
 it("counts only missing per-recipient receipts, not duplicate source events",()=>{
   const one=alert();
   const key=mentorAttentionReceiptKey(one);
   expect(mentorUnreadAttentionCount([one],[notice],new Set())).toBe(2);
   expect(mentorUnreadAttentionCount([one],[notice],
     new Set([key,mentorAnnouncementReceiptKey(notice)]))).toBe(0);
 });
});
