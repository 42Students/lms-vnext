import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminCollegeCompanyActionSchema}
 from "@/modules/placements/super-admin-college-company-action-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin college company operations",()=>{
 it("SA-placements-projects-30 requires an exact college scope for delete and restore",()=>{
  const service=read("src/modules/placements/super-admin-college-company-action-service.ts");
  expect(service).toContain('resolveActingCollege(context,"placements.manage")');
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(service).toContain("placementJobs.archivedAt");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
  expect(superAdminCollegeCompanyActionSchema.safeParse({
   relationshipId:"00000000-0000-4000-8000-000000000001",action:"RESTORE",confirmed:true,
  }).success).toBe(true);
 });
 it("SA-placements-projects-30 exposes create, trust, archive and restore with guarded actions",()=>{
  const code=read("src/components/admin/super-admin-college-company-actions.tsx");
  expect(code).toContain("Add company");
  expect(code).toContain('method:"PATCH"');
  expect(code).toContain("Delete company");
  expect(code).toContain("Restore company");
  expect(code).toContain("Cannot delete a company with drives");
  expect(code).toContain("useGuardedAction");
 });
});
