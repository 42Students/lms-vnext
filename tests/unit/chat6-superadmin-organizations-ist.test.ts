import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {organizationCreatedIstDate} from "@/modules/organizations/organization-created-date-model";

describe("Super Admin organization directory calendar boundaries",()=>{
 it("SA-admin-middle-organizations-IST-02 displays creation on the correct IST day",()=>{
  expect(organizationCreatedIstDate(new Date("2026-10-18T20:00:00Z"))).toBe("19 Oct 2026");
  expect(organizationCreatedIstDate(new Date("2026-10-18T04:00:00Z"))).toBe("18 Oct 2026");
  expect(organizationCreatedIstDate(new Date(Number.NaN))).toBe("—");
 });
 it("SA-admin-middle-organizations-IST-02 keeps authorized organization actions and avoids UTC truncation",()=>{
  const source=readFileSync("src/app/(authenticated)/admin/organizations/page.tsx","utf8");
  expect(source).toContain("organizationCreatedIstDate(organization.createdAt)");
  expect(source).not.toContain("organization.createdAt.toISOString().slice(0, 10)");
  expect(source).toContain('requirePermission(context, "admin-scope.select")');
  expect(source).toContain("const canCreate = can(");
  expect(source).toContain('"organization.manage",');
 });
});
