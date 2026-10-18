import {describe,expect,it,vi} from "vitest";
import {attributeRecruiterTeamJobs} from "@/modules/placements/recruiter-team-drive-count-service";
import {readFileSync} from "node:fs";

const rel="10000000-0000-4000-8000-000000000001",college="20000000-0000-4000-8000-000000000001";
const jobs=[
 {job:{id:"job-a",createdByUserId:"creator"},collegeId:college,relationshipId:rel},
 {job:{id:"job-b",createdByUserId:"other"},collegeId:college,relationshipId:rel},
];
describe("HR-BREAK-TEAM-ATTRIBUTION-40: count approved drives, never stale request history",()=>{
 it("credits distinct approved draft requests once, not repeated rows",()=>{
  expect(attributeRecruiterTeamJobs(jobs,[
   {userId:"owner",jobId:"job-a",status:"DRAFT"},
   {userId:"owner",jobId:"job-a",status:"DRAFT"},
  ])).toEqual({owner:1,other:1});
 });
 it("rejects cancelled, rejected and sent-back request rows as ownership evidence",()=>{
  expect(attributeRecruiterTeamJobs(jobs,[
   {userId:"former",jobId:"job-a",status:"CANCELLED"},
   {userId:"other",jobId:"job-b",status:"REJECTED"},
   {userId:"former",jobId:"job-a",status:"SENT_BACK"},
   {userId:"former",jobId:"job-b",status:"REQUEST"},
  ])).toEqual({creator:1,other:1});
 });
 it("conflicting approved identities fall back to creator rather than arbitrary first match",()=>{
  expect(attributeRecruiterTeamJobs(jobs,[
   {userId:"first",jobId:"job-a",status:"DRAFT"},
   {userId:"second",jobId:"job-a",status:"DRAFT"},
  ])).toEqual({creator:1,other:1});
 });
 it("unknown IDs never enlarge the already authorized job set",()=>{
  expect(attributeRecruiterTeamJobs(jobs,[
   {userId:"foreigner",jobId:"job-other",status:"DRAFT"},
   {userId:"owner",jobId:null,status:"DRAFT"},
  ])).toEqual({creator:1,other:1});
 });
 it("count service checks exact recruiter principal before database queries",()=>{
  const source=readFileSync("src/modules/placements/recruiter-team-drive-count-service.ts","utf8");
  expect(source).toContain('context.recruiter.userId!==context.user.id');
  expect(source).toContain('eq(placementRecruiterDriveRequests.status,"DRAFT")');
 });
 it("college branch suggestions fail closed for mismatched recruiter principal",()=>{
  const source=readFileSync("src/modules/placements/recruiter-college-branch-service.ts","utf8");
  expect(source).toContain('context.recruiter.userId!==context.user.id');
  expect(source).toContain('isNull(departments.archivedAt)');
 });
});
