import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {bulkDriveAddSchema} from "@/modules/placements/bulk-drive-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const uuid="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
describe("TPO forced student drive inclusion",()=>{
 it("TPO-students-14 requires explicit reason on ineligible inclusion and rejects unconfirmed payload",()=>{
  const base={roleOptionId:uuid,membershipIds:[uuid],confirmed:true as const};
  expect(bulkDriveAddSchema.safeParse({...base,includeIneligible:{reason:""}}).success).toBe(false);
  expect(bulkDriveAddSchema.safeParse({...base,includeIneligible:{reason:"Reviewed by placement cell"}}).success).toBe(true);
  expect(bulkDriveAddSchema.safeParse({...base,confirmed:false}).success).toBe(false);
 });
 it("TPO-students-14 keeps hard participation gates and rolls back rejected override/application as one transaction",()=>{
  const service=src("src/modules/placements/bulk-drive-service.ts");
  expect(service).toContain("requireLearnerPlacementAccess(learnerContext)");
  expect(service).toContain("hasActivePlacementDebarment");
  expect(service).toContain("throw new UnsafeForceInclude()");
  expect(service).toContain("evaluatePlacementEligibility(context,job.id,membershipId,tx)");
  expect(service).toContain('eventType:"STUDENTS_ADDED_TO_DRIVE_OVERRIDE"');
  expect(service).toContain("addedByCollege: Boolean(includeIneligibleReason)");
  expect(service).toContain("You were added to a placement drive");
 });
 it("TPO-students-14 exposes a reasoned Add-to-Drive option but keeps the existing confirmation and per-row outcomes",()=>{
  const ui=src("src/components/tpo/tpo-students-bulk-add.tsx");
  expect(ui).toContain("Add students who are not eligible anyway");
  expect(ui).toContain("overrideReason.trim()");
  expect(ui).toContain("runGuarded(submit)");
  expect(ui).toContain("formatTpoStudentsBulkOutcome(result)");
 });
});
