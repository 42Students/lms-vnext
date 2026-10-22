import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {parseAdminInventoryQuery} from "@/modules/platform-settings/admin-inventory-filter";
const page=readFileSync("src/app/(authenticated)/admin/settings/page.tsx","utf8");
describe("Super Admin Settings filter read fence",()=>{
 it("authorizes before errors, validates before database reads",()=>{
  const auth=page.indexOf('if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))');
  const parse=page.indexOf("parseAdminInventoryQuery(raw)");
  const load=page.indexOf("getSuperAdminPlatformSettings(context)");
  expect(auth).toBeGreaterThan(0);
  expect(auth).toBeLessThan(parse);
  expect(parse).toBeLessThan(load);
 });
 it("rejects out of scope and duplicate URL filters",()=>{
  expect(parseAdminInventoryQuery({section:["sms","operations"]})).toBeNull();
  expect(parseAdminInventoryQuery({secret:"bad"})).toBeNull();
 });
});
