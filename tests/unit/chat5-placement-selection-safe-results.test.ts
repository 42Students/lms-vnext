import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoSelectionReleaseFailureMessage,recordSelectionsSchema,releaseSelectionsSchema} from "@/modules/placements/tpo-drive-selection-model";
import {PlacementsServiceError} from "@/modules/placements/errors";

const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("TPO release — no internal errors leak in partial results",()=>{
 it("PLACEMENTS-SELECTION-ERROR-02 hides SQL, authorization, stack and uncontrolled messages",()=>{
  for(const err of [new Error('select * from auth_secrets; password=abc'),
    new Error('duplicate key violates unique constraint "placement_drive_selections_key"'),
    new Error("actor 123 has no permission: placements.manage"),new TypeError("null row"),
    {message:"database-user-secret"},null,undefined,"http://localhost/internal",42,
    new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS")]){
   const display=tpoSelectionReleaseFailureMessage(err);
   expect(display).toBe("Could not release this selection. Refresh and try again or contact your administrator.");
   expect(display).not.toMatch(/password|secret|duplicate|SQL|constraint|placements\.manage|localhost/i);
  }
 });
 it("PLACEMENTS-SELECTION-ERROR-03 gives only the known stale-preview action",()=>{
  expect(tpoSelectionReleaseFailureMessage(new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE")))
   .toBe("This selection changed. Refresh before releasing.");
  expect(tpoSelectionReleaseFailureMessage(new Error("PLACEMENT_JOB_PREVIEW_STALE")))
   .toBe("This selection changed. Refresh before releasing.");
 });
 it("PLACEMENTS-SELECTION-ERROR-04 routes both reconciliation and issuing failures through safe presentation, preserving partial results",()=>{
  const service=src("src/modules/placements/tpo-drive-selection-service.ts");
  expect(service.match(/reason:tpoSelectionReleaseFailureMessage\(error\)/g)).toHaveLength(2);
  expect(service).not.toContain("reason:error instanceof Error?error.message");
  expect(service).not.toContain('throw new Error("Offer issued but selection status needs reconciliation")');
  expect(service).toContain("summarizeSelectionRelease(results)");
  expect(service).toContain("results.push(");
 });
 it("PLACEMENTS-SELECTION-ERROR-05 never trusts surplus college ID or invalid release version",()=>{
  expect(recordSelectionsSchema.safeParse({action:"RECORD",entries:[],collegeId:id}).success).toBe(false);
  expect(releaseSelectionsSchema.safeParse({action:"VERIFY_AND_RELEASE",confirmed:true,
   selectionIds:[id],expectedRecordedAt:{[id]:"garbage"}}).success).toBe(false);
 });
});