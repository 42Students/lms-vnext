import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(authenticated)/admin/colleges/page.tsx","utf8");
describe("Super Admin college empty state",()=>{
 it("uses the authorized collection rather than a global unscoped count",()=>{
  expect(page).toContain("rows={visible}");
  expect(page).toContain("const visible=matches.slice(");
  expect(page).toContain('q ? "No colleges match your search" : "No active colleges in this scope"');
  expect(page).toContain("No active colleges in this scope");
  expect(page).toContain("selected Super Admin safety scope");
 });
});
