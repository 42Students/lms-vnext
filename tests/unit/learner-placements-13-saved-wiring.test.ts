import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const load=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("LEARNER-placements-13 saved job request wiring",()=>{
 it("LEARNER-placements-13 both mutating HTTP handlers check same origin before writes",()=>{
  const source=load("src/app/api/placements/learner/saved-jobs/[jobId]/route.ts");
  expect(source).toContain("isSameOriginRequest(request)");
  expect(source).toContain("saveOwnPlacementJob(await getCurrentRequestContext(),jobId)");
  expect(source).toContain("unsaveOwnPlacementJob(await getCurrentRequestContext(),jobId)");
  expect(source).not.toContain("requirePlacementManageScope");
 });
 it("LEARNER-placements-13 bookmarks are unique per membership and job",()=>{
  const schema=load("src/db/schema/placement-external.ts");
  expect(schema).toMatch(/uniqueIndex\("placement_saved_jobs_member_job_uq"\)/);
  expect(schema).toContain(".on(t.membershipId, t.jobId)");
 });
 it("LEARNER-placements-13 only exposes current membership and published scoped saved jobs",()=>{
  const service=load("src/modules/placements/saved-job-service.ts");
  expect(service).toContain("eq(placementSavedJobs.membershipId, learner.id)");
  expect(service).toContain('eq(placementJobs.status, "PUBLISHED")');
  expect(service).toContain("visibleIds.has(row.jobId)");
 });
});
