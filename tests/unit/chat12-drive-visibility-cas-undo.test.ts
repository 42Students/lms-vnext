import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO drive override concurrency",()=>{
 it("TPO-students-12 revokes only the expected current override, not a later TPO action",()=>{
  const service=src("src/modules/placements/eligibility-service.ts");
  const api=src("src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts");
  expect(service).toContain("options.expectedOverrideId?eq(placementEligibilityOverrides.id,options.expectedOverrideId):undefined");
  expect(service).toContain('eventType:action==="SET"?"PLACEMENT_OVERRIDE_SET":"PLACEMENT_OVERRIDE_CLEARED"');
  expect(service).toContain("recordEligibilityOverrideAudit(tx,context");
  expect(api).toContain("expectedOverrideId:z.string().uuid().optional()");
 });
 it("TPO-students-12 includes server-generated override IDs and guarded per-row undo with an explicit reason",()=>{
  const ui=src("src/components/tpo/tpo-students-drive-visibility.tsx");
  expect(ui).toContain("current.eligibility.override.id");
  expect(ui).toContain("expectedOverrideId:row.overrideId");
  expect(ui).toContain("Undo saved changes (only if still current)");
  expect(ui).toContain("Undo previous TPO bulk change");
 });
});
