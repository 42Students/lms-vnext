import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor audit contract",()=>{
 it("UX-mentor-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("resolveOptionalModuleAccess"=== "" ? /\w+/ : /resolveOptionalModuleAccess\s*\(/);
 });
 it("UX-mentor-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("<PageHeader");
  expect(src).toContain("hasActiveMembership");
 });
});
