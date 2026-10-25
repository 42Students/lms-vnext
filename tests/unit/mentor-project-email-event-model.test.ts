import {describe,expect,it} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {classifyMentorProjectEmailSource as classify,
 mentorProjectEmailSubmissionIsNotifiable as allowedSubmission} from
 "@/modules/projects/mentor-project-email-event-model";
const projectId="11111111-1111-4111-8111-111111111111";
const subjectId="22222222-2222-4222-8222-222222222222";
const base={subjectId,subjectType:"project_meeting",metadata:{projectId}};
describe("Mentor external-email source allowlist",()=>{
 it("recognises only real delivery submission and pending meeting request",()=>{
  expect(classify({...base,eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
   metadata:{projectId,status:"REQUESTED"}}))
   .toEqual({kind:"MEETING_REQUEST",projectId});
  expect(classify({...base,eventType:ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_SUBMITTED,
   subjectType:"project_submission"}))
   .toEqual({kind:"FINAL_SUBMISSION",projectId});
 });
 it("suppresses calendar drafts, decisions, meeting reschedules and forged project IDs",()=>{
  const kind=ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED;
  for(const status of ["DRAFT","SCHEDULED","CANCELLED",undefined]){
   expect(classify({...base,eventType:kind,metadata:{projectId,status}}))
    .toBeNull();
  }
  expect(classify({...base,eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_RESCHEDULED,
   metadata:{projectId,status:"REQUESTED"}})).toBeNull();
  expect(classify({...base,eventType:kind,
   metadata:{projectId:"forged",status:"REQUESTED"}})).toBeNull();
  expect(classify({...base,eventType:kind,
   subjectId:"not-a-uuid",metadata:{projectId,status:"REQUESTED"}})).toBeNull();
 });
});

describe("Mentor final-submission email dispatch recheck",()=>{
 const submittedAt=new Date("2026-10-01T10:00:00.000Z");
 it("permits current and historically reviewed submissions",()=>{
  for(const status of ["SUBMITTED","CHANGES_REQUESTED","APPROVED"])
   expect(allowedSubmission({status,submittedAt,deletedAt:null})).toBe(true);
 });
 it("suppresses missing, deleted and reverted-to-draft submissions",()=>{
  expect(allowedSubmission(null)).toBe(false);
  expect(allowedSubmission({status:"SUBMITTED",submittedAt,deletedAt:new Date()}))
   .toBe(false);
  expect(allowedSubmission({status:"DRAFT",submittedAt,deletedAt:null}))
   .toBe(false);
  expect(allowedSubmission({status:"SUBMITTED",submittedAt:null,deletedAt:null}))
   .toBe(false);
 });
});
