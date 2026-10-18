import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),rows:[] as unknown[][],
 can:vi.fn(),requirePermission:vi.fn(),active:vi.fn(),requests:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
vi.mock("@/modules/permissions/policy",()=>({
 can:mock.can,requirePermission:mock.requirePermission,
 AuthorizationError:class AuthorizationError extends Error{},
}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:mock.active}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({
 listOwnRecruiterDriveRequests:mock.requests,
}));

import {listRecruiterCollegeBranches} from "@/modules/placements/recruiter-college-branch-service";
import {countRecruiterAnswerableDriveRequests} from "@/modules/placements/hr-recruiter-open-change-counts-service";
import {listOwnRecruiterDecisionNotices} from "@/modules/placements/recruiter-decision-notice-service";
import {recruiterTeamAttributedDriveCounts} from "@/modules/placements/recruiter-team-drive-count-service";
import {recruiterVisiblePortfolioCounts} from "@/modules/placements/recruiter-portfolio-counts-service";

const college="123e4567-e89b-42d3-a456-426614174001";
const otherCollege="123e4567-e89b-42d3-a456-426614174002";
const context={user:{id:"recruiter"},recruiter:{
 userId:"recruiter",companyId:"company-a",status:"ACTIVE",
 grants:[{collegeId:college,companyRelationshipId:"rel-a"}],
}};

const builder=(rows:unknown[])=>({
 from(){return this;},innerJoin(){return this;},where(){return this;},
 orderBy(){return this;},groupBy(){return Promise.resolve(rows);},
 limit(){return Promise.resolve(rows);},
 then(ok:(x:unknown[])=>unknown,fail?:(error:unknown)=>unknown){
  return Promise.resolve(rows).then(ok,fail);
 },
});

describe("HR-BREAK-weak-services-01: actual service branches with mocked persistence",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mock.rows=[];
  mock.select.mockImplementation(()=>builder(mock.rows.shift()??[]));
  mock.getDb.mockReturnValue({select:mock.select});
  mock.can.mockReturnValue(true);
  mock.active.mockReturnValue(true);
  mock.requests.mockResolvedValue([]);
 });
 it("branches service denies all lookup for wrong college or revoked central policy",async()=>{
  expect(await listRecruiterCollegeBranches(context as never,otherCollege)).toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
  mock.can.mockReturnValue(false);
  expect(await listRecruiterCollegeBranches(context as never,college)).toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
  mock.can.mockReturnValue(true);
  mock.rows=[[{name:"Computer Science"},{name:"Electronics"}]];
  expect(await listRecruiterCollegeBranches(context as never,college))
   .toEqual(["Computer Science","Electronics"]);
  expect(mock.can).toHaveBeenCalledWith(context,"placements.recruiter.read",{
   collegeId:college,placementCompanyRelationshipId:"rel-a",
  });
 });
 it("OPEN change request counts need authorized job IDs and sum persisted company-facing rows",async()=>{
  expect(await countRecruiterAnswerableDriveRequests(college,[])).toEqual({});
  expect(mock.getDb).not.toHaveBeenCalled();
  mock.rows=[[{jobId:"job-a",count:"2"},{jobId:"job-b",count:1}]];
  expect(await countRecruiterAnswerableDriveRequests(college,["job-a","job-a","job-b"]))
   .toEqual({"job-a":2,"job-b":1});
 });
 it("decision notices never hit notifications table when there are no own requests",async()=>{
  expect(await listOwnRecruiterDecisionNotices(context as never,college)).toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
  mock.requests.mockResolvedValue([{id:"request-a"}]);
  mock.rows=[[{id:"notice-1",title:"Review complete",body:"Approved",
   createdAt:new Date("2026-10-18"),readAt:null,subjectId:"request-a"}]];
  const notices=await listOwnRecruiterDecisionNotices(context as never,college);
  expect(notices).toHaveLength(1);
  expect(notices[0]?.unread).toBe(true);
  expect(notices[0]?.href).toContain("collegeId="+college);
  expect(mock.requests).toHaveBeenCalledWith(context,college);
 });
 it("team totals deny unrelated employer grants and attribute approved jobs to submitter",async()=>{
  const jobs=[
   {job:{id:"job-a",createdByUserId:"tpo"},collegeId:college,relationshipId:"rel-a"},
   {job:{id:"job-b",createdByUserId:"recruiter-b"},collegeId:college,relationshipId:"rel-a"},
   {job:{id:"job-c",createdByUserId:"unrelated"},collegeId:otherCollege,relationshipId:"rel-a"},
  ];
  await expect(recruiterTeamAttributedDriveCounts(context as never,otherCollege,"rel-a",jobs))
   .rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
  mock.rows=[[{userId:"recruiter-a",jobId:"job-a"}]];
  const totals=await recruiterTeamAttributedDriveCounts(context as never,college,"rel-a",jobs);
  expect(totals).toEqual({"recruiter-a":1,"recruiter-b":1});
  expect(totals).not.toHaveProperty("unrelated");
  expect(mock.requirePermission).toHaveBeenCalledWith(context,"placements.recruiter.read",{
   collegeId:college,placementCompanyRelationshipId:"rel-a",
  });
 });
 it("portfolio counters refuse revoked/missing grants and no-ID portfolio avoids database access",async()=>{
  mock.active.mockReturnValue(false);
  await expect(recruiterVisiblePortfolioCounts(context as never,college,["job-a"]))
   .rejects.toThrow("placements.recruiter.read");
  mock.active.mockReturnValue(true);
  await expect(recruiterVisiblePortfolioCounts(context as never,otherCollege,["job-a"]))
   .rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
  expect(await recruiterVisiblePortfolioCounts(context as never,college,[])).toEqual({});
  await expect(recruiterVisiblePortfolioCounts({
   ...context,recruiter:{...context.recruiter,userId:"impersonator"},
  } as never,college,["job-a"])).rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
 });
});