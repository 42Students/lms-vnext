import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync("src/components/announcements/announcement-admin-workspace.tsx","utf8");
const superAdmin=readFileSync("src/app/(authenticated)/admin/announcements/page.tsx","utf8");
describe("Super Admin-only announcement consent",()=>{
 it("preserves shared College Admin composer defaults but requires consent in Super Admin",()=>{
  expect(source).toContain("requiresPublicationConsent=false");
  expect(source).toContain("requiresPublicationConsent?true:undefined");
  expect(source).toContain("(requiresPublicationConsent&&!editConsent)");
  expect(superAdmin).toContain("requiresPublicationConsent/>");
 });
});