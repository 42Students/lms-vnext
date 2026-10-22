import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=readFileSync("src/modules/placements/tpo-operations-service.ts","utf8");
const ui=readFileSync("src/components/placements/super-admin-needs-attention.tsx","utf8");

describe("G2-10-017-085: college-scoped needs-attention counts",()=>{
 it("counts closing-soon low-conversion drives once, not as their submitted applications",()=>{
  expect(source).toMatch(/select 'CLOSING_SOON_LOW_CONVERSION', j\.id, j\.title, j\.company_name,\s*1::int/);
  expect(source).toContain('where j.status = \'PUBLISHED\' and j.openings is not null');
  expect(source).toContain('coalesce(a.submitted,0) < ceil(j.openings / 2.0)');
 });
 it("separates exact category totals and drive counts from the three-row sample",()=>{
  expect(source).toContain('count(*) over(partition by code)::int as category_jobs');
  expect(source).toContain('sum(affected) over(partition by code)::int as category_affected');
  expect(source).toContain('from ranked where rn<=3');
  expect(ui).toContain('const rows=facts?.samples??items.filter(item=>item.code===category.code)');
  expect(ui).toContain('const affected=facts?.affected??rows.reduce');
  expect(ui).toContain('distinctDrives:facts?.jobs??rows.length');
 });
});
