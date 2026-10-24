import {describe,expect,it} from "vitest";
import {mentorConsecutiveCarryInSignal} from
 "@/modules/projects/mentor-consecutive-carry-model";
import type {MentorSprintSignOffSnapshot} from
 "@/modules/projects/mentor-sprint-signoff-snapshot-model";

const member="student-a",projectId="project-1";
const sprints=[
 {id:"s3",sequence:3,projectId,historyOrdinal:0},
 {id:"s2",sequence:2,projectId,historyOrdinal:1},
 {id:"s1",sequence:1,projectId,historyOrdinal:2},
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
 it("does not bridge a skipped sprint even when both sign-offs exist",()=>{
  const withGap=[sprints[0]!,{...sprints[2]!,historyOrdinal:2}];
  expect(mentorConsecutiveCarryInSignal(member,projectId,withGap,[
   snap("s3",2),snap("s1",1),
  ])).toBeNull();
 });
 it("recognizes adjacent sprints across a release-local sequence reset",()=>{
  const acrossReleases=[
   {id:"release-2-sprint-1",sequence:0,projectId,historyOrdinal:0},
   {id:"release-1-sprint-7",sequence:6,projectId,historyOrdinal:1},
  ];
  expect(mentorConsecutiveCarryInSignal(member,projectId,acrossReleases,[
   snap("release-2-sprint-1",2),snap("release-1-sprint-7",1),
  ])).toEqual({consecutive:2,carriedTasks:3});
 });
 it("stops counting after a gap even if two newest completed sprints are adjacent",()=>{
  const withGap=[sprints[0]!,sprints[1]!,
   {id:"s0",sequence:0,projectId,historyOrdinal:3}];
  expect(mentorConsecutiveCarryInSignal(member,projectId,withGap,[
   snap("s3",2),snap("s2",1),snap("s0",2),
  ])).toEqual({consecutive:2,carriedTasks:3});
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
