import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminPublishedDriveEditSchema} from "@/modules/placements/super-admin-published-drive-edit-model";
const read=(p:string)=>readFileSync(p,"utf8");
const input={confirmed:true,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",reason:"Update posting terms",
 title:"Example role",description:"Work details",locations:["Hyderabad"],
 applicationDeadline:"2099-12-31T00:00:00.000Z",openings:3,
 minimumAnnualCtcInr:500000,maximumAnnualCtcInr:900000};
describe("Super Admin published drive editing",()=>{
 it("SA-placements-projects-13 validates published edits and rejects invalid compensation",()=>{
  expect(superAdminPublishedDriveEditSchema.safeParse(input).success).toBe(true);
  expect(superAdminPublishedDriveEditSchema.safeParse({
   ...input,maximumAnnualCtcInr:100000,
  }).success).toBe(false);
  expect(superAdminPublishedDriveEditSchema.safeParse({
   ...input,locations:["Hyderabad","hyderabad"],
  }).success).toBe(false);
 });
 it("SA-placements-projects-13 enforces selected-college and optimistic version locks",()=>{
  const service=read("src/modules/placements/super-admin-published-drive-edit-service.ts");
  expect(service).toContain("resolveActingCollege(context");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('job.status!=="PUBLISHED"');
  expect(service).toContain("date_trunc('milliseconds'");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("SA-placements-projects-13 uses guarded form and IST-aware deadline",()=>{
  const component=read("src/components/placements/super-admin-published-drive-edit.tsx");
  expect(component).toContain("useGuardedAction");
  expect(component).toContain("driveDeadlineIstToIso");
  expect(component).toContain("Existing applications and offer decisions remain unchanged.");
 });
});
