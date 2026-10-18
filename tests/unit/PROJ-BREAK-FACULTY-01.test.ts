import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mayMutateProjectWithRole} from "@/modules/projects/member-role-kind-model";
import {mentorTaskTransitionParamsSchema,mentorTaskTransitionSchema,allowedMentorTaskTransition} from "@/modules/projects/mentor-task-transition-model";
import {mentorMeetingDecisionSchema,mentorMeetingDecisionStatus} from "@/modules/projects/mentor-meeting-decision-model";
import {mentorMeetingRescheduleParamsSchema,mentorMeetingRescheduleSchema,
 mentorMeetingCanReschedule,toIstLocalInput,fromIstLocalInput} from "@/modules/projects/mentor-meeting-reschedule-model";
import {learnerProjectTaskReviewNotice,learnerProjectDeliveryReviewNotice,
 learnerProjectDeliveryReopenedNotice} from "@/modules/projects/learner-project-review-notification-model";

const p="11111111-1111-4111-8111-111111111111",task="22222222-2222-4222-8222-222222222222";
const stamp="2026-10-18T04:35:00.000Z";
describe("PROJ-BREAK-FACULTY-01 Faculty/Mentor role journeys, state, dates and private notices",()=>{
 it("project mentor edit is granted by persisted role kind plus canMutate, never display label alone",()=>{
  for(const role of ["LEARNER","OBSERVER","REVIEWER","QA"] as const)
   expect(mayMutateProjectWithRole(role,true)).toBe(false);
  expect(mayMutateProjectWithRole("MENTOR",true)).toBe(true);
  expect(mayMutateProjectWithRole("CO_MENTOR",true)).toBe(true);
  expect(mayMutateProjectWithRole("MENTOR",false)).toBe(false);
  expect(mayMutateProjectWithRole("CO_MENTOR",false)).toBe(false);
 });
 it("mentor task commands deny terminal DONE/IN_REVIEW, missing confirmation, forged field and malformed UUID",()=>{
  expect(mentorTaskTransitionParamsSchema.safeParse({projectId:p,taskId:task}).success).toBe(true);
  expect(mentorTaskTransitionParamsSchema.safeParse({projectId:"foreign",taskId:task}).success).toBe(false);
  const valid={status:"BLOCKED",blockerReason:"Waiting for data",expectedUpdatedAt:stamp,confirmed:true};
  expect(mentorTaskTransitionSchema.safeParse(valid).success).toBe(true);
  for(const value of [
   {...valid,status:"DONE"},{...valid,status:"IN_REVIEW"},
   {...valid,confirmed:false},{...valid,expectedUpdatedAt:"yesterday"},
   {...valid,role:"ADMIN"},{...valid,blockerReason:" "},
   {...valid,status:"TODO"},{...valid,status:"IN_PROGRESS"},
   {status:"BLOCKED",expectedUpdatedAt:stamp,confirmed:true},
  ])expect(mentorTaskTransitionSchema.safeParse(value).success).toBe(false);
  expect(mentorTaskTransitionSchema.safeParse({status:"IN_PROGRESS",expectedUpdatedAt:stamp,confirmed:true}).success).toBe(true);
 });
 it("mentor cannot transition submitted/reviewed tasks or make no-op status changes",()=>{
  for(const from of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]){
   for(const to of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]){
    const allowed=["TODO","IN_PROGRESS","BLOCKED"].includes(from)&&
      ["TODO","IN_PROGRESS","BLOCKED"].includes(to)&&from!==to;
    expect(allowedMentorTaskTransition(from,to)).toBe(allowed);
   }
  }
  const source=readFileSync("src/modules/projects/mentor-task-transition-service.ts","utf8");
  expect(source).toContain('blockerReason:input.status==="BLOCKED"?input.blockerReason!:null');
  expect(source).toContain('sql`date_trunc(\'milliseconds\',');
  expect(source).toContain('scope.collegeId');
  expect(source).toContain("PROJECT_TASK_INVALID_STATE");
 });
 it("meeting decisions must confirm and match authored state, cannot cross apply outcome/note fields",()=>{
  const base={action:"COMPLETE",expectedUpdatedAt:stamp,confirmed:true};
  expect(mentorMeetingDecisionSchema.safeParse(base).success).toBe(true);
  expect(mentorMeetingDecisionSchema.safeParse({...base,note:"not allowed"}).success).toBe(false);
  expect(mentorMeetingDecisionSchema.safeParse({...base,action:"CANCEL",outcome:"not allowed"}).success).toBe(false);
  expect(mentorMeetingDecisionSchema.safeParse({...base,confirmed:false}).success).toBe(false);
  expect(mentorMeetingDecisionStatus("COMPLETE","SCHEDULED")).toBe(true);
  expect(mentorMeetingDecisionStatus("COMPLETE","REQUESTED")).toBe(false);
  expect(mentorMeetingDecisionStatus("COMPLETE","COMPLETED")).toBe(false);
  expect(mentorMeetingDecisionStatus("CANCEL","REQUESTED")).toBe(true);
  expect(mentorMeetingDecisionStatus("CANCEL","CANCELLED")).toBe(false);
 });
 it("meeting reschedule uses exact 330-minute IST shift, rejects impossible calendar days and overlong windows",()=>{
  expect(fromIstLocalInput("2028-02-29T00:00")).toBe("2028-02-28T18:30:00.000Z");
  expect(fromIstLocalInput("2028-02-29T23:59")).toBe("2028-02-29T18:29:00.000Z");
  expect(toIstLocalInput("2026-10-18T04:35:00.000Z")).toBe("2026-10-18T10:05");
  for(const bad of ["2026-02-29T10:05","2028-02-30T10:05","2026-04-31T10:05",
   "2026-10-18T24:00","2026-10-18T10:60","1999-12-31T10:00","invalid"]){
   expect(fromIstLocalInput(bad)).toBeNull();
  }
  const params={projectId:p,meetingId:task};
  expect(mentorMeetingRescheduleParamsSchema.safeParse(params).success).toBe(true);
  expect(mentorMeetingRescheduleParamsSchema.safeParse({...params,meetingId:"other-college"}).success).toBe(false);
  const start="2026-10-18T09:00:00.000Z",end="2026-10-18T10:00:00.000Z";
  const valid={startsAt:start,endsAt:end,expectedUpdatedAt:stamp,confirmed:true};
  expect(mentorMeetingRescheduleSchema.safeParse(valid).success).toBe(true);
  expect(mentorMeetingRescheduleSchema.safeParse({...valid,endsAt:start}).success).toBe(false);
  expect(mentorMeetingRescheduleSchema.safeParse({...valid,endsAt:"2026-10-19T10:00:00.000Z"}).success).toBe(false);
  expect(mentorMeetingRescheduleSchema.safeParse({...valid,confirmed:false}).success).toBe(false);
  expect(mentorMeetingCanReschedule("SCHEDULED","ACTIVE")).toBe(true);
  expect(mentorMeetingCanReschedule("RESCHEDULED","ACTIVE")).toBe(true);
  expect(mentorMeetingCanReschedule("COMPLETED","ACTIVE")).toBe(false);
  expect(mentorMeetingCanReschedule("SCHEDULED","ARCHIVED")).toBe(false);
 });
 it("mentor review notifications never expose reviewer comments/contact data and only link scoped app routes",()=>{
  const notice=learnerProjectTaskReviewNotice({projectId:p,taskId:task,decision:"CHANGES_REQUESTED"});
  expect(notice.title).toContain("Changes requested");
  expect(notice.actionHref).toContain("/learn/projects/");
  expect(JSON.stringify(notice)).not.toMatch(/reviewerEmail|privateFeedback|signedUrl/);
  expect(learnerProjectTaskReviewNotice({projectId:p,taskId:task,decision:"APPROVED"}).title).toBe("Task approved");
  expect(learnerProjectDeliveryReviewNotice(p,"APPROVED").title).toBe("Delivery accepted");
  expect(learnerProjectDeliveryReviewNotice(p,"CHANGES_REQUESTED").title).toBe("Changes requested");
  expect(learnerProjectDeliveryReopenedNotice(p).actionHref).toContain("?tab=delivery");
 });
});
