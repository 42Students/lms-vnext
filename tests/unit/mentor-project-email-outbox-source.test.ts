import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(path,"utf8");
describe("Mentor durable email-intent producer contracts",()=>{
 const outbox=read("src/modules/projects/mentor-project-email-outbox-service.ts");
 const meeting=read("src/modules/projects/meeting-service.ts");
 const submission=read("src/modules/projects/submission-service.ts");
 it("enqueues only audited real meeting requests and final submissions",()=>{
  expect(meeting).toContain('kind:"MEETING_REQUEST",excludeUserId:context.user.id');
  expect(submission).toContain('kind:"FINAL_SUBMISSION",excludeUserId:context.user.id');
  expect(meeting.indexOf('await queueMentorProjectEmailIntent(tx,'))
   .toBeGreaterThan(meeting.indexOf('summary:"Project meeting requested"'));
  expect(submission.indexOf('await queueMentorProjectEmailIntent(tx,'))
   .toBeGreaterThan(submission.indexOf('action: "SUBMITTED"'));
 });
 it("requires operations readiness and opt-in before idempotent, scoped job insert",()=>{
  expect(outbox).toContain('MENTOR_PROJECT_EMAIL_OUTBOX_READY');
  expect(outbox).toContain('selectDistinctOn([activityEvents.actorUserId]');
  expect(outbox).toContain('mentorEmailPreferenceFromSavedEvent(row).enabled');
  expect(outbox).toContain('eq(membershipRoles.role,"MENTOR")');
  expect(outbox).toContain('isNull(projectMembers.endedAt)');
  expect(outbox).toContain('onConflictDoNothing()');
  expect(outbox).not.toContain("sendMentorProjectEventEmail(");
  expect(outbox).not.toContain("recipientEmail:");
 });
});
