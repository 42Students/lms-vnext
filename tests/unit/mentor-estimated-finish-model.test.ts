import {describe,expect,it} from "vitest";
import {estimateMentorFinishWindow} from
 "@/modules/projects/mentor-estimated-finish-model";
import type {MentorVelocityProjection} from
 "@/modules/projects/mentor-sprint-velocity-model";

const velocity:MentorVelocityProjection={
 kind:"ESTIMATE",sampleCount:4,averageDonePoints:15,
 remainingPoints:45,approximateSprints:3,trend:"RISING",
};
const dated=[
 {status:"COMPLETED",startDate:"2026-09-01",endDate:"2026-09-07"},
 {status:"COMPLETED",startDate:"2026-09-08",endDate:"2026-09-14"},
 {status:"COMPLETED",startDate:"2026-09-15",endDate:"2026-09-21"},
 {status:"PLANNED",startDate:"2026-10-25",endDate:"2026-11-01"},
];
describe("Mentor projected finish versus recorded due",()=>{
 it("uses median completed-sprint calendar days and compares target",()=>{
  const result=estimateMentorFinishWindow({
   velocity,sprints:dated,asOf:new Date("2026-10-24T12:00:00Z"),
   dueDate:"2026-11-01",
  });
  expect(result).toMatchObject({
   kind:"PROJECTED",sprintDays:7,projectedFinishDate:"2026-11-14",
   dueDate:"2026-11-01",dueComparison:"AFTER",approximateSprints:3,
  });
 });
 it("makes no date claim on missing or invalid sprint cadence",()=>{
  const result=estimateMentorFinishWindow({
   velocity,sprints:dated.slice(0,2),
   asOf:new Date("2026-10-24T00:00:00Z"),dueDate:null,
  });
  expect(result.kind).toBe("UNAVAILABLE");
  expect(estimateMentorFinishWindow({
   velocity,sprints:dated.map(row=>({...row,
    startDate:"2026-09-21",endDate:"2026-09-20"})),
   asOf:new Date("2026-10-24T00:00:00Z"),dueDate:null,
  }).kind).toBe("UNAVAILABLE");
 });
 it("keeps due-date unavailable rather than inventing commitments",()=>{
  const result=estimateMentorFinishWindow({
   velocity,sprints:dated,asOf:new Date("2026-10-24T00:00:00Z"),
   dueDate:"bad-date",
  });
  expect(result).toMatchObject({
   kind:"PROJECTED",dueDate:null,dueComparison:"NO_DUE_DATE",
  });
 });
 it("does not project without recorded velocity",()=>{
  expect(estimateMentorFinishWindow({
   velocity:{kind:"INSUFFICIENT",sampleCount:2,reason:"Not enough signoffs"},
   sprints:dated,asOf:new Date(),dueDate:"2026-11-01",
  }).kind).toBe("UNAVAILABLE");
 });
});
