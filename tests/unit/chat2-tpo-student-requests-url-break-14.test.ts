import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoStudentRequestsHasInvalidUrlFilters} from "@/modules/placements/tpo-student-requests-url-model";

const collegeId="11111111-1111-4111-8111-111111111111";
describe("UX-tpo-LAST-THIRD-01 /tpo/students/requests preserves one college's authorized filter set",()=>{
 it("denies repeated status, free text or pages instead of silently selecting first",()=>{
  for(const ambiguous of [
   {status:["PENDING","APPROVED"]},{status:["PENDING"]},{search:["Ada","Bob"]},
   {page:["1","2"]},{pageSize:["25","100"]},{collegeId},
   {jobId:"other"}, {requestType:"ROUND_RESCHEDULE"}, {sort:"OLDEST_FIRST"},
  ])expect(tpoStudentRequestsHasInvalidUrlFilters(ambiguous),JSON.stringify(ambiguous)).toBe(true);
  expect(tpoStudentRequestsHasInvalidUrlFilters({status:"PENDING",page:"2",pageSize:"25",search:" Ada "})).toBe(false);
 });
 it("checks the scoped filters before the authorized service loads private request records",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/students/requests/page.tsx","utf8");
  expect(page).toContain("tpoStudentRequestsHasInvalidUrlFilters(raw) || !parsed.success");
  expect(page.indexOf("tpoStudentRequestsHasInvalidUrlFilters(raw)"))
   .toBeLessThan(page.indexOf("listTpoStudentRequests(context"));
  expect(page).toContain("No requests were loaded because one or more filters");
  expect(page).toContain("tpoStudentRequestsQuerySchema.safeParse");
  expect(page).toContain("collegeId: context.membership.collegeId");
  const service=readFileSync("src/modules/placements/tpo-students-service.ts","utf8");
  expect(service).toContain("tpoStudentRequestsQuerySchema");
 });
});
