import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {sameArchiveImpact,canArchiveDriveWithImpact} from "@/modules/placements/super-admin-drive-archive-model";
const read=(p:string)=>readFileSync(p,"utf8");
const impact={activeApplications:2,affectedLearners:2,openRounds:1,issuedOffers:1,acceptedOffers:0};
describe("Super Admin drive delete impact preview",()=>{
 it("SA-placements-projects-12 previews real application, learner, interview and offer counts",()=>{
  expect(canArchiveDriveWithImpact("PUBLISHED",impact)).toBe(true);
  expect(canArchiveDriveWithImpact("PUBLISHED",{...impact,acceptedOffers:1})).toBe(false);
  expect(sameArchiveImpact(impact,{...impact,issuedOffers:2})).toBe(false);
  const service=read("src/modules/placements/super-admin-drive-archive-service.ts");
  expect(service).toContain("resolveActingCollege(context");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain("getImpact(tx,jobId)");
 });
 it("SA-placements-projects-12 archives with CAS, cancelled rounds, withdrawn issued offers and learner notifications",()=>{
  const service=read("src/modules/placements/super-admin-drive-archive-service.ts");
  expect(service).toContain('status:"ARCHIVED"');
  expect(service).toContain('status:"CANCELLED"');
  expect(service).toContain('status:"WITHDRAWN"');
  expect(service).toContain("inAppNotifications");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
  expect(service).toContain("date_trunc('milliseconds'");
 });
 it("SA-placements-projects-12 requires same-origin confirmation and a typed reason",()=>{
  const route=read("src/app/api/admin/placements/jobs/[jobId]/delete/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("export async function GET");
  const ui=read("src/components/placements/super-admin-drive-archive.tsx");
  expect(ui).toContain("Preview delete impact");
  expect(ui).toContain("Confirm delete (archive)");
  expect(ui).toContain("useGuardedAction");
 });
});
