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
