import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/audit/actors/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-audit-actors-02",()=>{
 it("renders a shared responsive DataTable with explicit legacy empty copy and authorized rows",()=>{
  expect(source).toContain("<DataTable");
  expect(source).toContain("getRowKey=");
  expect(source).toContain("mobilePriority");
  expect(source).toContain("empty={<EmptyState");
  expect(source).toContain("No canonical placement events match these exact filters.");
  expect(source).not.toContain("<table");
 });
});
