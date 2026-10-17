import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const file=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO-requests-verification-19",()=>{
 it("keeps exact legacy TPO verification title, subtitle and actions",()=>{
  const workspace=file("src/components/verification/VerificationWorkspace.tsx");
  const panel=file("src/components/verification/TpoVerificationPanel.tsx");
  expect(workspace).toContain('legacyTpoCopy?"Verification":"Profile verification"');
  expect(workspace).toContain("Verified marks are what eligibility uses.");
  expect(panel).toContain('apiBase="/api/tpo/verification"');
  expect(panel).toContain("onReview={row=>{setSequenceIndex(null);setSelected(row);}}");
 });
 it("authorizes each read and decision on the server, not via caller-supplied role",()=>{
  for(const path of [
   "src/app/api/tpo/verification/review/route.ts",
   "src/app/api/tpo/verification/[membershipId]/[section]/route.ts",
   "src/app/api/tpo/verification/[membershipId]/[section]/documents/[receiptId]/route.ts",
  ])expect(file(path)).toContain("await requireTpoVerificationActor(context)");
  expect(file("src/app/api/tpo/verification/review/route.ts")).toContain("isSameOriginRequest(request)");
  expect(file("src/modules/verification/tpo-staff-auth.ts")).toContain('eq(membershipRoles.role,"TPO")');
  expect(file("src/modules/verification/staff-private-document-service.ts")).toContain("detail.documents.some");
 });
});
