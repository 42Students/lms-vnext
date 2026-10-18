import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({college:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({requireTpoJobCollege:state.college}));
import {getTpoRoundResultTable} from "@/modules/placements/tpo-round-result-table-service";
import {listTpoRecruiterProposedSlots} from "@/modules/placements/tpo-recruiter-slot-review-service";
import {getTpoRoundDriveDay} from "@/modules/placements/tpo-round-drive-day-service";
import {getTpoInterviewReadiness} from "@/modules/placements/tpo-interview-readiness-service";
const jobId="00000000-0000-4000-8000-000000000001";
const roundId="00000000-0000-4000-8000-000000000002";
const ctx=(roles:readonly string[],status="ACTIVE",platform="ACTIVE"):RequestContext=>({
 user:{id:"actor",identityUid:"sso",platformStatus:platform,systemRoles:[]},
 membership:{id:"member",collegeId:"college-a",organizationId:"org-a",status,roles},
}) as unknown as RequestContext;
beforeEach(()=>{
 state.college.mockReset();state.db.mockReset();
});

describe("TPO-BREAK-read-services-10 wrong roles, malformed IDs and tenant errors before private DB queries",()=>{
 it("round result table denies wrong tenant or inactive context before a single application row is selected",async()=>{
  state.college.mockRejectedValueOnce(new Error("TPO_COLLEGE_DENIED"));
  await expect(getTpoRoundResultTable(ctx(["TPO"]),{jobId,roundId})).rejects.toThrow("TPO_COLLEGE_DENIED");
  expect(state.db).not.toHaveBeenCalled();
  state.college.mockResolvedValue("college-a");
  for(const raw of [{jobId:"../foreign",roundId},{jobId,roundId:"foreign"},
    {jobId,roundId,companyId:"foreign"},{}]){
   await expect(getTpoRoundResultTable(ctx(["TPO"]),raw)).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
  }
 });
 it("recruiter slot review refuses invalid IDs and cross-college TPO permissions",async()=>{
  await expect(listTpoRecruiterProposedSlots(ctx(["TPO"]),"../other-job")).rejects.toThrow();
  expect(state.college).not.toHaveBeenCalled();
  expect(state.db).not.toHaveBeenCalled();
  state.college.mockRejectedValueOnce(new Error("TPO_COLLEGE_DENIED"));
  await expect(listTpoRecruiterProposedSlots(ctx(["LEARNER"]),jobId)).rejects.toThrow("TPO_COLLEGE_DENIED");
  expect(state.db).not.toHaveBeenCalled();
 });
 it("Drive Day denies learner, disabled and suspended sessions before reading roster",async()=>{
  for(const actor of [ctx(["LEARNER"]),ctx(["TPO"],"SUSPENDED"),ctx(["TPO"],"ACTIVE","DISABLED"),
    {...ctx(["TPO"]),membership:null}]){
   await expect(getTpoRoundDriveDay(actor,roundId)).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
  }
  await expect(getTpoRoundDriveDay(ctx(["TPO"]),"../other-round")).rejects.toThrow();
  expect(state.db).not.toHaveBeenCalled();
 });
 it("interview readiness never calls the calendar for wrong TPO roles or expired accounts",async()=>{
  for(const actor of [ctx(["LEARNER"]),ctx(["COLLEGE_ADMIN"]),ctx(["TPO"],"SUSPENDED"),
    ctx(["TPO"],"ACTIVE","DISABLED")]){
   await expect(getTpoInterviewReadiness(actor,{days:14})).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
  }
  await expect(getTpoInterviewReadiness(ctx(["TPO"]),{days:91})).rejects.toThrow();
  expect(state.db).not.toHaveBeenCalled();
 });
});
