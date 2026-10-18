import {describe,expect,it} from "vitest";
import {
 mentorSprintCreateSchema,mentorSprintTransitionSchema,
 isValidMentorSprintTransition,
} from "@/modules/projects/mentor-sprint-write-model";
import {
 mentorTaskCreateSchema,
} from "@/modules/projects/mentor-task-create-model";
import {
 mentorTaskTransitionSchema,allowedMentorTaskTransition,
} from "@/modules/projects/mentor-task-transition-model";
import {
 mentorTaskDetailsInputSchema,taskDetailsChangedFields,
} from "@/modules/projects/mentor-task-details-model";
import {mentorReleaseVersionMatches,nextMentorReleaseUpdateAt}
 from "@/modules/projects/mentor-release-version-model";

const sprintId="11111111-1111-4111-8111-111111111111";
const expectedUpdatedAt="2099-01-01T00:00:00.000Z";
const sprint={
 releaseId:sprintId,title:"Sprint one",description:null,goal:null,
 definitionOfDone:null,startDate:"2099-02-01",endDate:"2099-02-28",dueDate:"2099-02-28",
};
const backlog={
 sprintId:null,title:"Task one",description:null,
 acceptanceCriteria:null,priority:"MEDIUM",expectedSprintUpdatedAt:null,
};
const details={
 title:"Task title",description:null,acceptanceCriteria:null,
 priority:"MEDIUM",expectedUpdatedAt,
};

describe("IIT Dharwad Mentor sprint/task transition and input hardening",()=>{
 it("PROJ-BREAK-MENTOR-222 enumerates every allowed and forbidden sprint transition",()=>{
  const states=["PLANNED","ACTIVE","COMPLETED","ARCHIVED","UNKNOWN"];
  const actions=["START","COMPLETE","REOPEN","DELETE"];
  const valid=new Set(["PLANNED:START","ACTIVE:COMPLETE","COMPLETED:REOPEN"]);
  let allowed=0;
  for(const before of states)for(const action of actions){
   const ok=isValidMentorSprintTransition(before,action);
   expect(ok).toBe(valid.has(before+":"+action));
   if(ok)allowed++;
  }
  expect(allowed).toBe(3);
 });
 it("PROJ-BREAK-MENTOR-223 sprint builder rejects inverted dates, unknown keys and invalid release IDs",()=>{
  expect(mentorSprintCreateSchema.safeParse(sprint).success).toBe(true);
  expect(mentorSprintCreateSchema.safeParse({...sprint,startDate:"2099-03-01"}).success).toBe(false);
  expect(mentorSprintCreateSchema.safeParse({...sprint,releaseId:"foreign"}).success).toBe(false);
  expect(mentorSprintCreateSchema.safeParse({...sprint,collegeId:"foreign"}).success).toBe(false);
  expect(mentorSprintCreateSchema.safeParse({...sprint,title:" ".repeat(3)}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-224 sprint lifecycle requires a valid action and explicit version",()=>{
  expect(mentorSprintTransitionSchema.safeParse({action:"START",expectedUpdatedAt}).success).toBe(true);
  expect(mentorSprintTransitionSchema.safeParse({action:"DELETE",expectedUpdatedAt}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({action:"START"}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({action:"START",expectedUpdatedAt:"yesterday"}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({action:"START",expectedUpdatedAt,collegeId:"forged"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-225 forbids Mentor task status bypasses into review or DONE",()=>{
  const states=["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE","UNKNOWN"];
  const allowed=["TODO","IN_PROGRESS","BLOCKED"];
  for(const from of states)for(const to of states){
   expect(allowedMentorTaskTransition(from,to)).toBe(
    allowed.includes(from)&&allowed.includes(to)&&from!==to
   );
  }
 });
 it("PROJ-BREAK-MENTOR-226 validates blocker explanations and clears on nonblocked transitions",()=>{
  expect(mentorTaskTransitionSchema.safeParse({
   status:"BLOCKED",expectedUpdatedAt,confirmed:true,
   blockerReason:"Waiting for hardware",
  }).success).toBe(true);
  expect(mentorTaskTransitionSchema.safeParse({
   status:"BLOCKED",expectedUpdatedAt,confirmed:true,
  }).success).toBe(false);
  expect(mentorTaskTransitionSchema.safeParse({
   status:"TODO",expectedUpdatedAt,confirmed:true,blockerReason:"Stale blocker",
  }).success).toBe(false);
  expect(mentorTaskTransitionSchema.safeParse({
   status:"DONE",expectedUpdatedAt,confirmed:true,
  }).success).toBe(false);
  expect(mentorTaskTransitionSchema.safeParse({
   status:"TODO",expectedUpdatedAt,
  }).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-227 task builder never makes unsprinted work active or accepts stale sprint linkage",()=>{
  expect(mentorTaskCreateSchema.safeParse(backlog).success).toBe(true);
  expect(mentorTaskCreateSchema.safeParse({...backlog,status:"IN_PROGRESS"}).success).toBe(false);
  expect(mentorTaskCreateSchema.safeParse({...backlog,sprintId}).success).toBe(false);
  expect(mentorTaskCreateSchema.safeParse({...backlog,expectedSprintUpdatedAt}).success).toBe(false);
  expect(mentorTaskCreateSchema.safeParse({...backlog,collegeId:"foreign"}).success).toBe(false);
  expect(mentorTaskCreateSchema.safeParse({...backlog,title:""}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-228 task details reject status, assignee and sprint edits",()=>{
  expect(mentorTaskDetailsInputSchema.safeParse(details).success).toBe(true);
  expect(mentorTaskDetailsInputSchema.safeParse({...details,status:"DONE"}).success).toBe(false);
  expect(mentorTaskDetailsInputSchema.safeParse({...details,sprintId}).success).toBe(false);
  expect(mentorTaskDetailsInputSchema.safeParse({...details,assigneeMembershipId:sprintId}).success).toBe(false);
  expect(mentorTaskDetailsInputSchema.safeParse({...details,expectedUpdatedAt:"invalid"}).success).toBe(false);
  expect(taskDetailsChangedFields({
   title:"Task title",description:null,acceptanceCriteria:null,priority:"MEDIUM",
  },details)).toEqual([]);
  expect(taskDetailsChangedFields({
   title:"Old title",description:null,acceptanceCriteria:null,priority:"MEDIUM",
  },details)).toEqual(["title"]);
 });
 it("PROJ-BREAK-MENTOR-229 release version guards reject stale tokens and preserve monotonic writes",()=>{
  const current=new Date("2099-01-01T00:00:00.000Z");
  expect(mentorReleaseVersionMatches(current,expectedUpdatedAt)).toBe(true);
  expect(mentorReleaseVersionMatches(current,"2099-01-01T00:00:00.001Z")).toBe(false);
  expect(mentorReleaseVersionMatches(new Date(Number.NaN),expectedUpdatedAt)).toBe(false);
  expect(nextMentorReleaseUpdateAt(current,current)?.getTime()).toBe(current.getTime()+1);
  expect(nextMentorReleaseUpdateAt(current,new Date(Number.NaN))).toBeNull();
 });
});
