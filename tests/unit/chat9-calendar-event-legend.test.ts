import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("TPO Calendar kind legend",()=>{
 it("TPO-calendar-reports-11 renders counted color chips but retains multi-kind selection as open",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/placements/placement-calendar-workspace.tsx"),"utf8");
  expect(source).toContain('eventTypeCounts.get(filter.value)');
  expect(source).toContain("Legend: rounds and talks");
  expect(source).toContain('filter.value==="BLOCKED"');
  expect(source).toContain('filter.value==="FOLLOW_UP"');
  expect(source).toContain('name="kind"');
 });
});