import {describe,it,expect} from "vitest";
import {globalTpoRequestsQuerySchema,tpoRequestAgeCutoff} from "../../src/modules/placements/tpo-global-requests-model";
describe("TPO inbox one-day aging",()=>{
 it("selects a boundary at exactly 24 hours before the render clock",()=>{
  const clock=new Date("2026-10-15T12:00:00.000Z");
  expect(tpoRequestAgeCutoff("OLDER_THAN_1_DAY",clock)?.toISOString()).toBe("2026-10-14T12:00:00.000Z");
 });
 it("accepts the canonical URL value",()=>{
  expect(globalTpoRequestsQuerySchema.parse({age:"OLDER_THAN_1_DAY"}).age).toBe("OLDER_THAN_1_DAY");
 });
});
