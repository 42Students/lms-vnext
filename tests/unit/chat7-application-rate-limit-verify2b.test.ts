import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {placementApplicationsPerMinute} from "@/modules/placements/application-service";

describe("legacy learner application per-minute rate gate",()=>{
 it("has a safe default and bounded operator override",()=>{
  expect(placementApplicationsPerMinute({})).toBe(5);
  expect(placementApplicationsPerMinute({PLACEMENT_APPLICATION_RATE_LIMIT_PER_MINUTE:"3"})).toBe(3);
  expect(placementApplicationsPerMinute({PLACEMENT_APPLICATION_RATE_LIMIT_PER_MINUTE:"0"})).toBe(5);
  expect(placementApplicationsPerMinute({PLACEMENT_APPLICATION_RATE_LIMIT_PER_MINUTE:"400"})).toBe(5);
 });
 it("serializes across jobs, counts successful writes and returns exact HTTP 429 copy",()=>{
  const svc=readFileSync("src/modules/placements/application-service.ts","utf8");
  const api=readFileSync("src/lib/api-error.ts","utf8");
  expect(svc).toContain("pg_advisory_xact_lock(hashtextextended");
  expect(svc).toContain('eq(placementApplicationStatusHistory.toStatus,"SUBMITTED")');
  expect(svc).toContain("await assertPlacementApplicationRateLimit(tx,membership.id)");
  expect(api).toContain('error.code==="PLACEMENT_APPLICATION_RATE_LIMITED"?429');
  expect(api).toContain("Too many applications in the last minute. Please try again shortly.");
 });
});
