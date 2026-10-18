import {describe,expect,it} from "vitest";
import {isFutureProjectMeetingWindow} from "@/modules/projects/meeting-window-policy";
import {mayCloseProjectSprint} from "@/modules/projects/sprint-close-policy";
import {isValidMentorSprintTransition,mentorSprintTransitionSchema} from "@/modules/projects/mentor-sprint-write-model";
import {maySaveMentorMeetingStatus} from "@/modules/projects/mentor-meeting-status-model";
import {mentorMeetingDecisionStatus,mentorMeetingDecisionSchema} from "@/modules/projects/mentor-meeting-decision-model";
import {allowedMentorTaskTransition,mentorTaskTransitionSchema} from "@/modules/projects/mentor-task-transition-model";

const revision="2026-10-18T09:00:00.123Z";
describe("PROJ-BREAK-MENTOR exhaustive workflow state boundaries",()=>{
 it("PROJ-BREAK-mentor-state-01 every sprint start/complete/reopen edge has exactly one source state",()=>{
  const states=["PLANNED","ACTIVE","COMPLETED","ARCHIVED","INVALID"];
  const actions=["START","COMPLETE","REOPEN","INVALID"];
  const allowed=new Set(["PLANNED:START","ACTIVE:COMPLETE","COMPLETED:REOPEN"]);
  for(const before of states)for(const action of actions)
    expect(isValidMentorSprintTransition(before,action),before+":"+action).toBe(allowed.has(before+":"+action));
  for(const invalid of [
   {action:"START",expectedUpdatedAt:"2026-10-18"},
   {action:"COMPLETE",expectedUpdatedAt:revision,tenantId:"other"},
   {action:"RETRY",expectedUpdatedAt:revision},
  ])expect(mentorSprintTransitionSchema.safeParse(invalid).success).toBe(false);
 });
 it("PROJ-BREAK-mentor-state-02 sprint closure is allowed only with a valid zero count",()=>{
  expect(mayCloseProjectSprint(0)).toBe(true);
  for(const value of [-1,1,1000,0.01,NaN,Infinity,-Infinity])
    expect(mayCloseProjectSprint(value),String(value)).toBe(false);
 });
 it("PROJ-BREAK-mentor-state-03 mentor cannot mark a learner task reviewed or done without submission/review",()=>{
  const states=["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE","ARCHIVED","UNKNOWN"];
  const mutable=new Set(["TODO","IN_PROGRESS","BLOCKED"]);
  for(const before of states)for(const after of states){
   const expected=mutable.has(before)&&mutable.has(after)&&before!==after;
   expect(allowedMentorTaskTransition(before,after),before+" -> "+after).toBe(expected);
  }
  const base={status:"BLOCKED",expectedUpdatedAt:revision,confirmed:true};
  expect(mentorTaskTransitionSchema.safeParse({...base,blockerReason:"Lab unavailable"}).success).toBe(true);
  for(const raw of [base,{...base,blockerReason:"   "},{...base,confirmed:false},
    {...base,status:"DONE",blockerReason:"oops"},
    {...base,status:"TODO",blockerReason:"invalid"},
    {...base,blockerReason:"x".repeat(4001)}])
    expect(mentorTaskTransitionSchema.safeParse(raw).success).toBe(false);
 });
 it("PROJ-BREAK-mentor-state-04 all mentor meeting rescheduling and decision transitions fail closed",()=>{
  const states=[null,"DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED","UNKNOWN"];
  const nexts=["DRAFT","SCHEDULED","RESCHEDULED"] as const;
  for(const current of states)for(const next of nexts)for(const timeChanged of [true,false]){
   const expected=current===null?next!=="RESCHEDULED":
    current==="DRAFT"?next!=="RESCHEDULED":
    current==="REQUESTED"?next==="SCHEDULED":
    current==="SCHEDULED"?next==="SCHEDULED"&&!timeChanged||next==="RESCHEDULED"&&timeChanged:
    current==="RESCHEDULED"?next==="RESCHEDULED":false;
   expect(maySaveMentorMeetingStatus(current,next,timeChanged),
    String(current)+" -> "+next+" timeChanged="+timeChanged).toBe(expected);
  }
  for(const before of states){
   expect(mentorMeetingDecisionStatus("COMPLETE",before??"UNKNOWN")).toBe(["SCHEDULED","RESCHEDULED"].includes(before??""));
   expect(mentorMeetingDecisionStatus("CANCEL",before??"UNKNOWN")).toBe(["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED"].includes(before??""));
  }
  for(const input of [
   {action:"CANCEL",expectedUpdatedAt:revision,confirmed:true,outcome:"Wrong"},
   {action:"COMPLETE",expectedUpdatedAt:revision,confirmed:true,note:"Wrong"},
   {action:"CANCEL",expectedUpdatedAt:revision,confirmed:false},
   {action:"COMPLETE",expectedUpdatedAt:"not a date",confirmed:true},
   {action:"CANCEL",expectedUpdatedAt:revision,confirmed:true,otherCollege:true},
  ])expect(mentorMeetingDecisionSchema.safeParse(input).success).toBe(false);
 });
 it("PROJ-BREAK-mentor-time-05 validates real instants at IST midnight boundaries, not local formatted labels",()=>{
  const now=Date.parse("2026-10-18T18:29:59.000Z"); // 23:59:59 IST
  expect(isFutureProjectMeetingWindow(new Date(now+1),new Date(now+2),now)).toBe(true);
  expect(isFutureProjectMeetingWindow(new Date(now),new Date(now+1),now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date(now+1),new Date(now+1),now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date(now+2),new Date(now+1),now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date(NaN),new Date(now+10),now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date(now+1),new Date(NaN),now)).toBe(false);
 });
});
