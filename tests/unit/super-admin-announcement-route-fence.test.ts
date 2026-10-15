import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("Super Admin announcements route fence",()=>{
 it("checks active platform Super Admin before revealing DB10 status",()=>{
  const code=readFileSync("src/app/(authenticated)/admin/announcements/page.tsx","utf8");
  expect(code).toMatch(/!isSuperAdmin\(context\)\s*\|\|\s*context\.user\.platformStatus\s*!==\s*"ACTIVE"/);
  expect(code.indexOf('redirect("/dashboard")')).toBeLessThan(code.indexOf("announcementsRuntimeEnabled()"));
 });
});
