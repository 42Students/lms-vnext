import {describe,expect,it} from "vitest";
import {projectHrNotifications,filterHrNotificationJobs,clampHrInboxPage}
 from "@/modules/placements/hr-notifications-model";
const jobs=[{id:"job",title:"Graduate engineering drive"}];
const at=new Date("2099-01-01T00:00:00.000Z");
const record={id:"notice",subjectId:"job",eventType:"placements.job.published",
 createdAt:at,readAt:null};
describe("HR-NOTIFICATIONS-93 employer announcement notice projection",()=>{
 it("denies malformed dates, unowned jobs and unsupported private event types",()=>{
  const rows=[record,{...record,id:"bad-date",createdAt:new Date(Number.NaN)},
   {...record,id:"other",subjectId:"foreign"},
   {...record,id:"private",eventType:"college.admin.private"}];
  expect(projectHrNotifications(rows,jobs)).toEqual([{
   id:"notice",jobId:"job",title:"Graduate engineering drive",
   label:"Drive published",createdAt:at,unread:true,
  }]);
 });
 it("reports a closed drive distinctly and does not mark a read notice as new",()=>{
  expect(projectHrNotifications([{...record,eventType:"placements.job.closed",readAt:at}],jobs))
   .toMatchObject([{label:"Drive closed",unread:false}]);
 });
 it("matches employer-owned drive titles with case-insensitive query without mutating all jobs",()=>{
  expect(filterHrNotificationJobs(jobs,"graduate")).toEqual(jobs);
  expect(filterHrNotificationJobs(jobs,"none")).toEqual([]);
  expect(filterHrNotificationJobs(jobs,"")).toEqual(jobs);
 });
 it("clamps deep links after authorization scoping, avoiding empty stale pages",()=>{
  expect(clampHrInboxPage(999,26)).toBe(2);
  expect(clampHrInboxPage(5,0)).toBe(1);
  expect(clampHrInboxPage(Number.NaN,20)).toBe(1);
 });
});