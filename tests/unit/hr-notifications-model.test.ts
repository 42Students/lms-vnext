import {describe,expect,it} from "vitest";
import {hrNotificationsQuerySchema,projectHrNotifications} from "@/modules/placements/hr-notifications-model";
describe("HR notifications privacy projection",()=>{
 it("removes foreign company records and arbitrary private messages",()=>{
  const rows=[
   {id:"1",subjectId:"mine",eventType:"placements.job.published",createdAt:new Date(0),readAt:null},
   {id:"2",subjectId:"foreign",eventType:"placements.job.closed",createdAt:new Date(1),readAt:null},
   {id:"3",subjectId:"mine",eventType:"placements.application.submitted",createdAt:new Date(2),readAt:null},
  ];
  expect(projectHrNotifications(rows,[{id:"mine",title:"Engineer"}])).toEqual([
   {id:"1",jobId:"mine",title:"Engineer",label:"Drive published",createdAt:rows[0]!.createdAt,unread:true},
  ]);
 });
 it("validates filters without allowing caller-supplied company",()=>{
  expect(hrNotificationsQuerySchema.safeParse({unreadOnly:"true"}).success).toBe(true);
  expect(hrNotificationsQuerySchema.safeParse({companyId:"other"}).success).toBe(false);
 });
});
