import {describe,expect,it} from "vitest";
import {projectMentorVelocity} from "@/modules/projects/mentor-sprint-velocity-model";
const sprint=(n:number,status="COMPLETED")=>({id:"s"+n,sequence:n,status});
const history=(n:number,donePoints:number)=>({sprintId:"s"+n,donePoints,plannedPoints:20});

describe("Mentor signed-off sprint velocity forecast",()=>{
 it("needs three historical sign-off snapshots",()=>{
  const output=projectMentorVelocity([sprint(1),sprint(2),sprint(3)],
    [history(1,10),history(2,14)],35);
  expect(output).toMatchObject({kind:"INSUFFICIENT",sampleCount:2});
 });
 it("uses four recent completed sign-offs and ignores future periods",()=>{
  const output=projectMentorVelocity(
    [sprint(1),sprint(2),sprint(3),sprint(4),sprint(5,"PLANNED")],
    [history(1,5),history(2,10),history(3,15),history(4,20),history(5,200)],
    30);
  expect(output).toEqual({kind:"ESTIMATE",sampleCount:4,averageDonePoints:12.5,
    remainingPoints:30,approximateSprints:3,trend:"RISING"});
 });
 it("uses the latest four signed-off sprints across release resets",()=>{
  const releaseHistory=[
    {id:"s1",releaseId:"r1",sequence:0,status:"COMPLETED"},
    {id:"s2",releaseId:"r1",sequence:1,status:"COMPLETED"},
    {id:"s3",releaseId:"r1",sequence:2,status:"COMPLETED"},
    {id:"s4",releaseId:"r2",sequence:0,status:"COMPLETED"},
    {id:"s5",releaseId:"r2",sequence:1,status:"COMPLETED"},
    {id:"s6",releaseId:"r2",sequence:2,status:"PLANNED"},
  ];
  const output=projectMentorVelocity(releaseHistory,[
    {sprintId:"s1",donePoints:2,plannedPoints:20},
    {sprintId:"s2",donePoints:8,plannedPoints:20},
    {sprintId:"s3",donePoints:12,plannedPoints:20},
    {sprintId:"s4",donePoints:16,plannedPoints:20},
    {sprintId:"s5",donePoints:20,plannedPoints:20},
  ],42,[{id:"r1",sequence:0},{id:"r2",sequence:1}]);
  expect(output).toEqual({
    kind:"ESTIMATE",sampleCount:4,averageDonePoints:14,
    remainingPoints:42,approximateSprints:3,trend:"RISING",
  });
 });
 it("does not promise a forecast for no earned points",()=>{
  const output=projectMentorVelocity(
    [sprint(1),sprint(2),sprint(3)],
    [history(1,0),history(2,0),history(3,0)],100);
  expect(output.kind).toBe("INSUFFICIENT");
 });
 it("handles zero work remaining without inventing a delivery date",()=>{
  const output=projectMentorVelocity(
    [sprint(1),sprint(2),sprint(3)],
    [history(1,10),history(2,10),history(3,10)],0);
  expect(output).toMatchObject({kind:"ESTIMATE",approximateSprints:0,
    remainingPoints:0,trend:"UNKNOWN"});
 });
});
