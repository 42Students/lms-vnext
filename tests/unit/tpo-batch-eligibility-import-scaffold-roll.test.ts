import {describe,expect,it} from "vitest";
import {buildTpoEligibilityImportScaffold} from "@/modules/placements/tpo-eligibility-import-scaffold-model";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
describe("TPO-batches-31 batch scaffold identity safety",()=>{
 it("exports trusted unique rolls with UUID fallback",()=>{
  expect(buildTpoEligibilityImportScaffold([
   {membershipId:a,rollNumber:"21CS001"},{membershipId:b,rollNumber:null},
  ])).toBe("studentCode,decision,reason\r\n21CS001,,\r\n"+b+",,\r\n");
 });
 it("falls back to UUIDs for duplicate and formula-looking codes",()=>{
  expect(buildTpoEligibilityImportScaffold([
   {membershipId:a,rollNumber:"=1+1"},{membershipId:b,rollNumber:"=1+1"},
  ])).toContain(a+",,\r\n"+b+",,");
 });
});
