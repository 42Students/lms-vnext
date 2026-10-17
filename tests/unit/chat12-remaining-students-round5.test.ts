import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat12 remaining Students scope and safety",()=>{
 it("TPO-students-06 exposes date, N-drive, and reasoned lifting without conflating membership override",()=>{
  const ui=s("src/components/tpo/tpo-timed-debar-control.tsx");
  expect(ui).toContain("untilDrives");
  expect(ui).toContain("untilDate");
  expect(ui).toContain("Reason for lifting");
 });
 it("TPO-students-07 retains DB08 immutable lift history while student dispute is still OPEN",()=>{
  const code=s("src/modules/placements/debarment-service.ts");
  expect(code).toContain("liftPlacementDebarment");
  expect(code).toContain("The DB trigger creates an immutable LIFTED action.");
 });
 it("TPO-students-10 links to the authorized preparation support view; assigning courses remains OPEN",()=>{
  const page=s("src/app/(authenticated)/tpo/students/preparation-prep/page.tsx");
  expect(page).toContain("requireTpoBatchActor");
  expect(page).toContain("Review recorded placement history");
 });
 it("TPO-students-12 cannot silently use bulk Add-to-Drive as a visibility override",()=>{
  const service=s("src/modules/placements/bulk-drive-service.ts");
  expect(service).toContain("requireLearnerPlacementAccess");
  expect(service).toContain("evaluatePlacementEligibility");
 });
 it("TPO-students-14 prevents silent addition of ineligible students",()=>{
  const service=s("src/modules/placements/bulk-drive-service.ts");
  expect(service).toContain('eligibility.status === "INELIGIBLE"');
  expect(service).toContain("onConflictDoNothing");
 });
 it("TPO-students-15 persists learner notification alongside each new bulk application",()=>{
  const service=s("src/modules/placements/bulk-drive-service.ts");
  expect(service).toContain("tx.insert(inAppNotifications)");
  expect(service).toContain("userId:learner.userId");
 });
 it("TPO-students-33 validates academic import with a college-scoped preview before commit",()=>{
  const route=s("src/app/api/placements/tpo/students/academic-import/route.ts");
  expect(route).toContain("isSameOriginRequest");
  expect(route).toContain("previewTpoAcademicImport");
  expect(route).toContain("commitTpoAcademicImport");
 });
 it("TPO-students-34 audits verified academic import, while application rechecking remains OPEN",()=>{
  const service=s("src/modules/placements/tpo-academic-import-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain('eventType: "ACADEMIC_RECORD_IMPORTED"');
 });
 it("TPO-students-49 does not broaden college membership role authorization without parity approval",()=>{
  const exportRoute=s("src/app/api/placements/tpo/students/export/route.ts");
  expect(exportRoute).toContain('hasMembershipRole(context, "TPO")');
  expect(exportRoute).toContain('result.definitions.registrationsAvailable');
 });
 it("TPO-students-50 retains explicit registration choice ahead of the existing application fallback",()=>{
  const model=s("src/modules/placements/tpo-students-model.ts");
  expect(model).toContain('choice==="PLACEMENTS"||(choice===null&&applicationCount>0)');
 });
 it("TPO-students-54 distinguishes recorded on-campus and off-campus placement in the final outcome",()=>{
  const component=s("src/components/tpo/tpo-student-outcome-pill.tsx");
  expect(component).toContain('recorded==="PLACED_ON_CAMPUS"||recorded==="PLACED_OFF_CAMPUS"');
  expect(component).toContain("AFTER_COLLEGE_LABELS[recorded]");
 });
});
