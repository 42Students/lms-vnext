import {describe,expect,it} from "vitest";
import {mentorConsecutiveCarryInSignal} from
 "@/modules/projects/mentor-consecutive-carry-model";
import type {MentorSprintSignOffSnapshot} from
 "@/modules/projects/mentor-sprint-signoff-snapshot-model";

const member="student-a",projectId="project-1";
const sprints=[
 {id:"s3",sequence:3,projectId},
 {id:"s2",sequence:2,projectId},
 {id:"s1",sequence:1,projectId},
];
const snap=(sprintId:string,carriedCount:number):MentorSprintSignOffSnapshot=>({
 version:1,sprintId,plannedPoints:10,donePoints:4,taskCount:3,
 memberRows:[{membershipId:member,taskCount:3,doneCount:1,waitingCount:0,
  openCount:2,carriedCount,donePoints:4,plannedPoints:10,openPoints:6}],
});
describe("Mentor consecutive incoming carry signals",()=>{
 it("requires two or more consecutive observed sign-offs",()=>{
  expect(mentorConsecutiveCarryInSignal(member,projectId,sprints,[
   snap("s3",2),snap("s2",1),snap("s1",0),
  ])).toEqual({consecutive:2,carriedTasks:3});
 });
 it("counts all three recent carried sign-offs when available",()=>{
  expect(mentorConsecutiveCarryInSignal(member,projectId,sprints,[
   snap("s3",2),snap("s2",1),snap("s1",1),
  ])).toEqual({consecutive:3,carriedTasks:4});
 });
 it("never bridges a missing historical snapshot",()=>{
  expect(mentorConsecutiveCarryInSignal(member,projectId,sprints,[
   snap("s3",2),snap("s1",1),
  ])).toBeNull();
 });
 it("does not infer carries from another project or member",()=>{
  expect(mentorConsecutiveCarryInSignal("student-b",projectId,sprints,[
   snap("s3",2),snap("s2",1),
  ])).toBeNull();
  expect(mentorConsecutiveCarryInSignal(member,"other-project",sprints,[
   snap("s3",2),snap("s2",1),
  ])).toBeNull();
 });
});
