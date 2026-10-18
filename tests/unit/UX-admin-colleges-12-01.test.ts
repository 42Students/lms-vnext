import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/admin/colleges/page.tsx",import.meta.url),"utf8");
describe("UX-admin-colleges-12-01",()=>{
 it("uses signed-off shared, labeled mobile-safe filters without rewriting scope or copy",()=>{
  expect(source).toContain("<Input");
  expect(source).toContain("<Select");
  expect(source).toContain("<Button");
  expect(source).not.toContain("<select");
  expect(source).not.toMatch(/<input\\b(?:(?!>).)*type="(?:search|number|date|text|email)"/s);
  expect(source).toContain('method="get"');
  expect(source).toContain("<PageHeader");
 });
});
