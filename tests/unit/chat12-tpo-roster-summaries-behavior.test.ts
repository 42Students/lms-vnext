import {describe,expect,it} from "vitest";
import {
 summarizeTpoStudents,summarizeTpoStudentBranches,
 type TpoStudentRow,
} from "@/modules/placements/tpo-students-model";

const BRANCH_A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BRANCH_B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const learner=(branchId:string,branchName:string,registered:boolean,placed:boolean,
 journey:TpoStudentRow["journeyState"]):TpoStudentRow=>({
 branchId,branchName,registeredForPlacements:registered,placed,journeyState:journey,
} as TpoStudentRow);

describe("TPO-BREAK-roster-summary-01 registration denominator and historical placed counts",()=>{
 it("does not misreport placement rate as a percentage of all learners",()=>{
  const rows=[
   learner(BRANCH_A,"Computer Science",true,true,"PLACED"),
   learner(BRANCH_A,"Computer Science",true,false,"APPLYING"),
   learner(BRANCH_A,"Computer Science",true,false,"READY_NOT_APPLYING"),
   learner(BRANCH_A,"Computer Science",false,true,"PLACED"),
   learner(BRANCH_B,"Biotechnology",false,false,"NOT_REGISTERED"),
  ];
  const totals=summarizeTpoStudents(rows);
  expect(totals).toMatchObject({activeLearners:5,placementPool:3,
   placed:2,placedInPool:1,placedOutsidePool:1,readyNotApplying:1,
   applying:1,notRegistered:1,readinessUnverified:true});
  const branches=summarizeTpoStudentBranches(rows);
  expect(branches).toHaveLength(2);
  expect(branches[0]).toMatchObject({branchName:"Biotechnology",
   placementPool:0,placementRatePercent:null});
  expect(branches[1]).toMatchObject({branchName:"Computer Science",
   activeLearners:4,placed:2,placedInPool:1,placementPool:3,
   placementRatePercent:33.33});
 });
 it("uses null rather than a deceptive zero when a branch has no registered placement pool",()=>{
  const output=summarizeTpoStudentBranches([
   learner(BRANCH_A,"No registrations",false,false,"NOT_REGISTERED"),
   learner(BRANCH_A,"No registrations",false,true,"PLACED"),
  ]);
  expect(output[0].placementRatePercent).toBeNull();
  expect(output[0].placedOutsidePool).toBe(1);
 });
 it("is deterministic for empty input and same-name branches with distinct UUIDs",()=>{
  expect(summarizeTpoStudentBranches([])).toEqual([]);
  const output=summarizeTpoStudentBranches([
   learner(BRANCH_B,"Same",true,false,"APPLYING"),
   learner(BRANCH_A,"Same",true,false,"APPLYING"),
  ]);
  expect(output.map(x=>x.branchId)).toEqual([BRANCH_A,BRANCH_B]);
  expect(output.map(x=>x.placementRatePercent)).toEqual([0,0]);
 });
});
