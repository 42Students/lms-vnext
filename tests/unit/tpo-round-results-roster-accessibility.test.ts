import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx","utf8");
describe("TPO bulk round result roster accessibility",()=>{
 it("exposes legacy-height keyboard-scroll viewport and stable page controls",()=>{
  expect(source).toContain("max-h-[420px]");
  expect(source).toContain('aria-label="Round result entries, scrollable roster"');
  expect(source).toContain('aria-describedby="round-result-roster-scroll-hint" tabIndex={0}');
  expect(source).toContain('aria-label="Eligible applicant pages"');
  expect(source).toContain('pageHref(data.page+1)');
  expect(source).toContain('data.rows.map(row=>({applicationId:row.applicationId,');
 });
});
