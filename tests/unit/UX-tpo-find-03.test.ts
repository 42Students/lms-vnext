import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/find/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-find-03",()=>{
 it("uses shared controls without changing legacy labels or authorized data",()=>{
  expect(source).toContain("<Input type=\"search\"");
  expect(source).toContain("<Button type=\"submit\" className=\"self-end\">Find</Button>");
  expect(source).toContain("role=\"alert\"");
 });
});
