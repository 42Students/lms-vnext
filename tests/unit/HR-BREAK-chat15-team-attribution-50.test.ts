import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),requirePermission:vi.fn(),rows:[] as {userId:string;jobId:string|null}[],
}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/permissions/policy",()=>({
 requirePermission:mocks.requirePermission,
 AuthorizationError:class AuthorizationError extends Error{},
}));
import {attributeRecruiterTeamJobs,recruiterTeamAttributedDriveCounts}
 from "@/modules/placements/recruiter-team-drive-count-service";

const college="123e4567-e89b-42d3-a456-426614174001";
const relation="123e4567-e89b-42d3-a456-426614174002";
const otherCollege="123e4567-e89b-42d3-a456-426614174003";
const context={
 user:{id:"recruiter-a"},recruiter:{grants:[{collegeId:college,companyRelationshipId:relation}]},
};
const job=(id:string,author="creator",scope=college,relationship=relation)=>({
 job:{id,createdByUserId:author},collegeId:scope,relationshipId:relationship,
});
const jobs=[job("job-1"),job("job-2","second")];

describe("HR-TEAM-ATTR-50: recruiter drive attribution is scoped and idempotent",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[];
  mocks.select.mockImplementation(()=>({
   from(){return this;},
   where(){return Promise.resolve(mocks.rows);},
  }));
  mocks.getDb.mockReturnValue({select:mocks.select});
 });
 it("counts a job once even when a paginated caller repeats its authorized row",()=>{
  expect(attributeRecruiterTeamJobs([jobs[0]!,jobs[0]!,jobs[1]!],[]))
   .toEqual({creator:1,second:1});
 });
 it("credits a unique approved submission instead of the TPO job creator",()=>{
  expect(attributeRecruiterTeamJobs(jobs,[{jobId:"job-1",userId:"requester"}]))
   .toEqual({requester:1,second:1});
 });
 it("falls back to the job creator on contradictory stored approvals regardless of row order",()=>{
  const requests=[
   {jobId:"job-1",userId:"employee-a"},
   {jobId:"job-1",userId:"employee-b"},
  ];
  expect(attributeRecruiterTeamJobs(jobs,requests)).toEqual({creator:1,second:1});
  expect(attributeRecruiterTeamJobs(jobs,[...requests].reverse()))
   .toEqual({creator:1,second:1});
 });
 it("cannot credit orphan, unapproved or duplicate request rows",()=>{
  const requests=[
   {jobId:null,userId:"attacker"},{jobId:"foreign",userId:"attacker"},
   {jobId:"job-2",userId:"second"},{jobId:"job-2",userId:"second"},
  ];
  expect(attributeRecruiterTeamJobs(jobs,requests)).toEqual({creator:1,second:1});
  expect(attributeRecruiterTeamJobs([],requests)).toEqual({});
 });
 it("checks the exact active relationship permission and refuses missing grant before SQL",async()=>{
  await expect(recruiterTeamAttributedDriveCounts(context as never,otherCollege,relation,jobs))
   .rejects.toThrow("placements.recruiter.read");
  expect(mocks.getDb).not.toHaveBeenCalled();
  mocks.requirePermission.mockImplementationOnce(()=>{throw new Error("FORBIDDEN");});
  await expect(recruiterTeamAttributedDriveCounts(context as never,college,relation,jobs))
   .rejects.toThrow("FORBIDDEN");
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.requirePermission).toHaveBeenCalledWith(context,"placements.recruiter.read",{
   collegeId:college,placementCompanyRelationshipId:relation,
  });
 });
 it("filters foreign jobs and deduplicates caller rows before request attribution",async()=>{
  mocks.rows=[{jobId:"job-1",userId:"employee-a"}];
  const counts=await recruiterTeamAttributedDriveCounts(context as never,college,relation,[
   jobs[0]!,jobs[0]!,jobs[1]!,job("foreign-job","attacker",otherCollege),
   job("foreign-relationship","attacker",college,"other-relationship"),
  ]);
  expect(counts).toEqual({"employee-a":1,second:1});
  expect(counts).not.toHaveProperty("attacker");
  expect(mocks.select).toHaveBeenCalledTimes(1);
 });
 it("avoids touching persistence when no authorized jobs are in the requested scope",async()=>{
  await expect(recruiterTeamAttributedDriveCounts(context as never,college,relation,[
   job("foreign-job","attacker",otherCollege),
  ])).resolves.toEqual({});
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
});
