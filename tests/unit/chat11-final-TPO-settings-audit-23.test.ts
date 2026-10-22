import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {TPO_BUILTIN_JOB_TYPES,isTpoBuiltinJobType} from "@/modules/placements/tpo-builtin-job-types";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO job type persistence final sprint",()=>{
 it("TPO-settings-audit-23 preserves the canonical college-scoped write and read contract",()=>{
  const write=source("src/modules/placements/tpo-job-type-write-service.ts");
  const read=source("src/modules/placements/tpo-configuration-read-service.ts");
  const page=source("src/app/(authenticated)/tpo/settings/job-types/page.tsx");
  expect(write).toContain("eq(placementTpoJobTypes.collegeId,collegeId)");
  expect(write).toContain("TPO_JOB_TYPE_IN_USE");
  expect(write).toContain("createTpoJobType");
  expect(write).toContain("setTpoJobTypeActive");
  expect(write).toContain("setTpoJobTypeCountsAsPlaced");
  expect(read).toContain("getTpoJobTypes");
  expect(page).toContain("<TpoUnifiedJobTypesEditor");
  expect(page).toContain("types={[...builtin,...custom]}");
  expect(TPO_BUILTIN_JOB_TYPES).toHaveLength(5);
  expect(isTpoBuiltinJobType("Full-time")).toBe(true);
  expect(isTpoBuiltinJobType("my custom job type")).toBe(false);
 });
});