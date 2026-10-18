import {describe,expect,it} from "vitest";
import {
 tpoStudentsQuerySchema,tpoStudentRequestsQuerySchema,
} from "@/modules/placements/tpo-students-service";
const COLLEGE="22222222-2222-4222-8222-222222222222";
describe("TPO-BREAK-roster-query-01 strict student roster and search boundaries",()=>{
 it("defaults to a bounded first page, preserves explicit boolean false and never accepts tenant override keys",()=>{
  const value=tpoStudentsQuerySchema.parse({collegeId:COLLEGE,hasResume:"NO",
   hasCodingProfiles:"YES",cgpaRecorded:"NO",marksVerified:"YES",
  });
  expect(value).toMatchObject({page:1,pageSize:25,hasResume:false,
   hasCodingProfiles:true,cgpaRecorded:false,marksVerified:true});
  expect(tpoStudentsQuerySchema.safeParse({collegeId:COLLEGE,studentMembershipId:COLLEGE}).success).toBe(false);
  expect(tpoStudentsQuerySchema.safeParse({collegeId:"../../wrong-college"}).success).toBe(false);
 });
 it("rejects invalid pagination, negative counts, impossible ratios and forged facet values",()=>{
  for(const bad of [
   {page:0},{page:"not-number"},{page:100001},{pageSize:0},{pageSize:101},
   {minProjects:-1},{minProjects:51},{minCgpa:-1},{maxCgpa:11},
   {minApplications:-1},{maxOffers:10001},{birthYear:1899},{gender:"PRIVATE"},
   {hasResume:"maybe"},{profileStatus:"SECRET"},{journeyState:"READY"},
   {minTenthPct:101},{minRoundReached:-1},
  ]) expect(tpoStudentsQuerySchema.safeParse({collegeId:COLLEGE,...bad}).success).toBe(false);
 });
 it("rejects inverted upper bounds rather than silently dropping valid students",()=>{
  for(const bad of [
   {minCgpa:9,maxCgpa:7},{minApplications:5,maxApplications:1},
   {minOffers:3,maxOffers:1},
  ]) expect(tpoStudentsQuerySchema.safeParse({collegeId:COLLEGE,...bad}).success).toBe(false);
  expect(tpoStudentsQuerySchema.safeParse({collegeId:COLLEGE,minCgpa:7,maxCgpa:9}).success).toBe(true);
 });
});
describe("TPO-BREAK-student-requests-query-01 strict status and scope",()=>{
 it("uses safe pagination and disabled urgency by default",()=>{
  expect(tpoStudentRequestsQuerySchema.parse({collegeId:COLLEGE}))
   .toMatchObject({collegeId:COLLEGE,page:1,pageSize:25,urgentOnly:false});
 });
 it("rejects unsupported request kinds, forged actor ID, malformed dates and page size",()=>{
  for(const bad of [
   {requestType:"OWNERSHIP_OVERRIDE"},{status:"UNKNOWN"},{userId:COLLEGE},
   {page:"Infinity"},{pageSize:500},{requestedAfter:"yesterday"},
   {requestedBefore:new Date("bad")},{search:"x".repeat(151)},
  ])expect(tpoStudentRequestsQuerySchema.safeParse({collegeId:COLLEGE,...bad}).success).toBe(false);
 });
});
