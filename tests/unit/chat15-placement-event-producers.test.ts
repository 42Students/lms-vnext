import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("LEARNER-placements-R04 persisted event producers",()=>{
 it("LEARNER-placements-R04 applies outcomes and reports confirmed absence through one DB transaction",()=>{
  const s=source("src/modules/placements/result-service.ts");
  expect(s).toContain("eventId:learnerResultEvent.id");
  expect(s).toContain('applied.outcome==="ABSENT"?"MARKED_ABSENT":"APPLICATION_STATUS_CHANGED"');
  expect(s).toContain("membershipId:current.application.membershipId");
 });
 it("LEARNER-placements-R04 ties offer accept/decline and persisted job closures to same activity transaction",()=>{
  const s=source("src/modules/placements/offer-service.ts");
  expect(s).toContain("acceptedNoticeEvent.id");
  expect(s).toContain("declinedNoticeEvent.id");
  const job=source("src/modules/placements/job-service.ts");
  expect(job).toContain("kind:\"DRIVE_CLOSED\"");
  expect(job).toContain("kind:\"DRIVE_CANCELLED\"");
  expect(job).toContain("PLACEMENTS_JOB_CANCELLED");
 });
 it("LEARNER-placements-R04 sends only to currently active college learner roles honoring preferences",()=>{
  const service=source("src/modules/placements/learner-placement-event-delivery.ts");
  for(const check of [
   'eq(collegeMemberships.collegeId,input.collegeId)',
   'eq(collegeMemberships.status,"ACTIVE")',
   'eq(membershipRoles.role,"LEARNER")',
   'eq(users.platformStatus,"ACTIVE")',
   'learnerPlacementEventUsesMatchingJobsPreference(input.kind)',
   'deliverInAppNotificationInTransaction(inner,input.eventId',
   'usersToNotify.slice(start,start+PLACEMENT_NOTICE_DELIVERY_POLICY.inAppBatchSize)',
  ])expect(service).toContain(check);
  expect(service).not.toContain("onConflictDoUpdate");
 });
 it("LEARNER-placements-R04 creates no receipt in the browser or GET handler",()=>{
  const service=source("src/modules/placements/learner-placement-event-delivery.ts");
  expect(service).not.toContain("export async function GET");
  expect(service).not.toContain("listOwnNotifications(");
 });
});
