import {describe,it,expect} from "vitest";
import {globalTpoRequestsQuerySchema,tpoRequestAgeCutoff} from "../../src/modules/placements/tpo-global-requests-model";
describe("global TPO requests 30-day triage",()=>{
 const clock=new Date("2026-10-15T12:00:00.000Z");
 it("computes an exact thirty-day cutoff",()=>{
  expect(tpoRequestAgeCutoff("OLDER_THAN_30_DAYS",clock)?.toISOString()).toBe("2026-09-15T12:00:00.000Z");
 });
 it("preserves seven-day cutoff and all-state",()=>{
  expect(tpoRequestAgeCutoff("OLDER_THAN_7_DAYS",clock)?.toISOString()).toBe("2026-10-08T12:00:00.000Z");
  expect(tpoRequestAgeCutoff("ALL",clock)).toBeUndefined();
 });
 it("validates selection instead of accepting arbitrary day values",()=>{
  expect(globalTpoRequestsQuerySchema.safeParse({age:"OLDER_THAN_30_DAYS"}).success).toBe(true);
  expect(globalTpoRequestsQuerySchema.safeParse({age:"OLDER_THAN_999_DAYS"}).success).toBe(false);
 });
});
