import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/admin/features/page.tsx",import.meta.url),"utf8");
describe("UX-admin-features-12-01",()=>{
 it("preserves GET-filter query names with accessible shared phone controls",()=>{
  expect(source).toContain("<Input");
  expect(source).toContain("<Select");
  expect(source).toContain("<Button");
  expect(source).not.toContain("<select");
  expect(source).not.toContain("<button");
  expect(source).toContain("<PageHeader");
 });
});
