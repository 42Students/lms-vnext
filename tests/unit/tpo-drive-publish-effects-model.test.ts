import {describe,expect,it} from "vitest";
import {collegeDate} from "@/modules/placements/tpo-drive-publish-effects";
import {tpoDriveLifecycleSchema} from "@/modules/placements/tpo-drive-lifecycle-model";
describe("TPO-drives-46 TPO-drive-workspace-15 publication effects",()=>{
 it("requires an explicit email choice and does not claim delivery",()=>{
  expect(tpoDriveLifecycleSchema.parse({
   action:"PUBLISH",expectedStatus:"DRAFT",confirmed:true,
   reason:"Checked applicant eligibility",notifyByEmail:false,
  }).notifyByEmail).toBe(false);
  expect(tpoDriveLifecycleSchema.safeParse({
   action:"PUBLISH",expectedStatus:"DRAFT",confirmed:true,
   reason:"Checked applicant eligibility",notifyByEmail:"true",
  }).success).toBe(false);
 });
 it("derives date in college timezone",()=>{
  expect(collegeDate(new Date("2026-10-16T20:30:00Z"))).toBe("2026-10-17");
 });
});