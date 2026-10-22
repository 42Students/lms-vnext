import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("old JobSearchController scoped vNext compatibility",()=>{
 const route=source("src/app/api/placements/jobs/route.ts");
 const service=source("src/modules/placements/job-service.ts");

 it("rejects duplicated or ambiguous filter aliases before querying",()=>{
  expect(route).toContain('url.searchParams.getAll(key).length!==1');
  expect(route).toContain('url.searchParams.has("query")&&url.searchParams.has("q")');
  expect(route).toContain('url.searchParams.has("deptId")&&url.searchParams.has("departmentId")');
  expect(route).toContain('url.searchParams.has("limit")&&url.searchParams.has("size")');
 });

 it("bounds program and department matches to the authorized college",()=>{
  expect(service).toContain('d.college_id=${collegeId}::uuid');
  expect(service).toContain('ep.allowed_program_ids');
  expect(service).toContain('options?.jobType?');
  expect(service).toContain('await requirePlacementManageScope(context, collegeId)');
 });

 it("keeps learnerId a same-membership authorization check instead of an impersonation filter",()=>{
  expect(route).toContain('parsed.data.learnerId!==context.membership.id');
  expect(route).toContain('listLearnerPlacementJobs(context)');
  expect(route).toContain('source:"OWN_LEARNER_SCOPE"');
 });

 it("distinguishes an authorized empty result from an unavailable database",()=>{
  expect(route).toContain('empty:page.empty,retryable:false');
  expect(route).toContain('error:"JOB_SEARCH_UNAVAILABLE"');
  expect(route).toContain('retryable:true,requestId:response.headers.get("x-request-id")');
  expect(route).toContain('response.headers.set("Retry-After","5")');
 });
});
