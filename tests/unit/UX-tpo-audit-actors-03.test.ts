import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/audit/actors/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-audit-actors-03",()=>{
 it("uses shared controls without changing legacy labels or authorized data",()=>{
  expect(source).toContain("<Input");
  expect(source).toContain("<Select");
  expect(source).toMatch(/<Button\s+type="submit"[^>]*>Apply filters<\/Button>/);
  expect(source).toContain("<DataTable");
 });
});
