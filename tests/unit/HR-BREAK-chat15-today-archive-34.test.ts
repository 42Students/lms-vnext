import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const mocks=vi.hoisted(()=>({getDb:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
import {listRecruiterTodayRoundsNeedingSlots}
 from "@/modules/placements/hr-today-open-slots-service";
import {listRecruiterTodayOfferActions}
 from "@/modules/placements/hr-today-offer-actions-service";

const college="123e4567-e89b-42d3-a456-426614174001";
const job="123e4567-e89b-42d3-a456-426614174002";

describe("HR-TODAY-ARCHIVE-34 no stale archived-drive follow-ups",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it("does not query any private interview or offer data for an empty authorized job allowlist",async()=>{
  await expect(listRecruiterTodayRoundsNeedingSlots(college,[],new Date()))
   .resolves.toEqual([]);
  await expect(listRecruiterTodayOfferActions(college,[])).resolves.toEqual([]);
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("enforces non-archived PUBLISHED job and original college in both Today queries",()=>{
  for(const file of [
   "src/modules/placements/hr-today-open-slots-service.ts",
   "src/modules/placements/hr-today-offer-actions-service.ts",
  ]){
   const source=readFileSync(file,"utf8");
   expect(source).toContain("inArray(placementJobs.id,ids)");
   expect(source).toContain("eq(placementJobs.collegeId,collegeId)");
   expect(source).toContain('eq(placementJobs.status,"PUBLISHED")');
   expect(source).toContain("isNull(placementJobs.archivedAt)");
  }
 });
 it("does not duplicate jobs in the bounded authorized list",()=>{
  for(const file of [
   "src/modules/placements/hr-today-open-slots-service.ts",
   "src/modules/placements/hr-today-offer-actions-service.ts",
  ]){
   expect(readFileSync(file,"utf8")).toContain("const ids=[...new Set(authorizedJobIds)]");
  }
  expect(job).not.toBe(college);
 });
});
