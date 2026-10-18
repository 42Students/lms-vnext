import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrNotificationsQuerySchema,hrInboxPageBounds,projectHrNotifications,
 filterHrNotificationJobs,HR_INBOX_PAGE_SIZE} from "@/modules/placements/hr-notifications-model";
import {hrRecruiterReplySchema} from "@/modules/placements/hr-conversation-reply-model";
const read=(p:string)=>readFileSync(p,"utf8");
const at=new Date("2099-01-01T00:00:00Z");
describe("chat-16 HR messaging and notifications privacy",()=>{
 it("hr-notification-filter-01 rejects invalid college IDs, rogue fields and huge pages",()=>{
  expect(hrNotificationsQuerySchema.safeParse({collegeId:"wrong"}).success).toBe(false);
  expect(hrNotificationsQuerySchema.safeParse({page:10001}).success).toBe(false);
  expect(hrNotificationsQuerySchema.safeParse({q:"x".repeat(121)}).success).toBe(false);
  expect(hrNotificationsQuerySchema.safeParse({unexpected:"x"}).success).toBe(false);
  expect(hrNotificationsQuerySchema.parse({})).toEqual({unreadOnly:"false",page:1,q:""});
 });
 it("hr-notification-visibility-01 drops other-job rows and unrelated event types",()=>{
  const visible="11111111-1111-4111-8111-111111111111";
  const other="22222222-2222-4222-8222-222222222222";
  const rows=[
   {id:"one",subjectId:visible,eventType:"placements.job.published",createdAt:at,readAt:null},
   {id:"two",subjectId:other,eventType:"placements.job.closed",createdAt:at,readAt:null},
   {id:"three",subjectId:visible,eventType:"placements.offer.created",createdAt:at,readAt:null},
  ];
  expect(projectHrNotifications(rows,[{id:visible,title:"QA Engineer"}])).toEqual([{
   id:"one",jobId:visible,title:"QA Engineer",label:"Drive published",createdAt:at,unread:true,
  }]);
  expect(filterHrNotificationJobs([{title:"QA Engineer"},{title:"Backend Developer"}],"  qa ")).toEqual([{title:"QA Engineer"}]);
 });
 it("hr-notification-bounds-01 never reports a nonzero last item for an out-of-range page",()=>{
  expect(HR_INBOX_PAGE_SIZE).toBe(25);
  expect(hrInboxPageBounds(1,0)).toMatchObject({pages:0,first:0,last:0});
  expect(hrInboxPageBounds(1,26)).toMatchObject({pages:2,first:1,last:25});
  expect(hrInboxPageBounds(2,26)).toMatchObject({pages:2,first:26,last:26});
  expect(hrInboxPageBounds(3,26)).toMatchObject({pages:2,first:0,last:0});
 });
 it("hr-message-reply-01 rejects empty, oversized and extra fields",()=>{
  const threadId="11111111-1111-4111-8111-111111111111";
  expect(hrRecruiterReplySchema.safeParse({threadId,body:" hello "}).success).toBe(true);
  expect(hrRecruiterReplySchema.safeParse({threadId,body:"  "}).success).toBe(false);
  expect(hrRecruiterReplySchema.safeParse({threadId,body:"x".repeat(4001)}).success).toBe(false);
  expect(hrRecruiterReplySchema.safeParse({threadId,body:"yes",senderType:"TPO"}).success).toBe(false);
 });
 it("hr-notification-service-01 scopes to recruiter, college, company and job",()=>{
  const source=read("src/modules/placements/hr-notifications-service.ts");
  expect(source).toContain("hasActiveRecruiter(context)");
  expect(source).toContain("grants.some(g=>g.collegeId===query.collegeId)");
  expect(source).toContain("row.collegeId===collegeId&&row.companyId===context.recruiter!.companyId");
  expect(source).toContain("eq(inAppNotifications.userId,context.user.id)");
  expect(source).toContain("eq(activityEvents.collegeId,collegeId)");
  expect(source).toContain("inArray(activityEvents.subjectId,jobIds)");
 });
});
