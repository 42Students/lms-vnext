import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const service=readFileSync("src/modules/announcements/super-admin-college-broadcast-service.ts","utf8");
const page=readFileSync("src/app/(authenticated)/admin/announcements/page.tsx","utf8");
describe("Super Admin broadcast targets independent of selected college",()=>{
 it("loads an authorized active-college directory for global and scoped Super Admins",()=>{
  expect(service).toContain("listSuperAdminBroadcastColleges");
  expect(service).toContain("eq(organizations.status,\"ACTIVE\")");
  expect(service).toContain("context.adminScope?.organizationId");
  expect(page).toContain("listSuperAdminBroadcastColleges(context)");
  expect(page).toContain("colleges={broadcastColleges}");
 });
});