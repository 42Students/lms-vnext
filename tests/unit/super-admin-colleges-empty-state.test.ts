import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(authenticated)/admin/colleges/page.tsx","utf8");
describe("Super Admin college empty state",()=>{
 it("uses the authorized collection rather than a global unscoped count",()=>{
  expect(page).toContain("rows.length === 0");
  expect(page).toContain("No active colleges in this scope");
  expect(page).toContain("selected Super Admin safety scope");
 });
});
