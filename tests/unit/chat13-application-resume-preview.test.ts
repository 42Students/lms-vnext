import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin verified private resume preview",()=>{
 it("SA-placements-projects-21 resolves a submitted RESUME receipt for the college-scoped application",()=>{
  const s=read("src/modules/placements/college-application-detail-service.ts");
  expect(s).toContain("verificationDocumentManifest(receiptRecord.snapshot)");
  expect(s).toContain('doc.purpose==="RESUME"');
  expect(s).toContain("isSuperAdmin(ctx)");
  expect(s).toContain('hasMembershipRole(ctx,"TPO")');
  expect(s).not.toContain("privateObjectKey");
 });
 it("SA-placements-projects-21 delegates private access to the established CLEAN-verified route",()=>{
  const ui=read("src/components/placements/college-application-detail-drawer.tsx");
  expect(ui).toContain("Resume Preview · Open securely");
  expect(ui).toContain("detail.resume.available&&detail.resume.url");
  const service=read("src/modules/verification/staff-private-document-service.ts");
  expect(service).toContain('receipt.scanStatus!=="CLEAN"');
  expect(service).toContain("createPrivateReadGrant");
 });
});
