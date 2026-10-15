import {describe,it,expect} from "vitest";
import {companyShareLifecycleStatus,companyShareLifecycleLabel} from "../../src/modules/placements/company-share/status-model";
const clock=new Date("2026-10-15T12:00:00.000Z");
describe("TPO company-share lifecycle status",()=>{
 it("distinguishes active links from expired ones",()=>{
  expect(companyShareLifecycleStatus({expiresAt:"2026-10-16T12:00:00Z",revokedAt:null},clock)).toBe("ACTIVE");
  expect(companyShareLifecycleStatus({expiresAt:"2026-10-14T12:00:00Z",revokedAt:null},clock)).toBe("EXPIRED");
 });
 it("does not portray a revoked link as an active link",()=>{
  const status=companyShareLifecycleStatus({expiresAt:"2026-10-16T12:00:00Z",revokedAt:"2026-10-15T10:00:00Z"},clock);
  expect(companyShareLifecycleLabel(status)).toBe("Revoked");
 });
 it("fails closed for corrupt expiry data",()=>{
  expect(companyShareLifecycleStatus({expiresAt:"?",revokedAt:null},clock)).toBe("EXPIRED");
 });
});
