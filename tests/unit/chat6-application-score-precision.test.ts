import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("Super Admin application scores",()=>{
 it("sorts on the persisted fractional round score before paging, never integer-truncates",()=>{
  const source=readFileSync("src/modules/placements/college-drive-applications-service.ts","utf8");
  expect(source).toContain("max(rr.score_percent)::double precision");
  expect(source).not.toContain("max(rr.score_percent)::integer");
  expect(source).toContain('sql`${source.screeningScore} desc nulls last`');
  expect(source).toContain('sql`${source.screeningScore} asc nulls last`');
 });
 it("rounds the display percentage while retaining the underlying sort value",()=>{
  const ui=readFileSync("src/components/placements/college-application-pipeline-controls.tsx","utf8");
  expect(ui).toContain("Math.round(score)");
  expect(ui).toContain('sortDirection:query.sort==="SCORE_DESC"');
  expect(ui).toContain("row.partialScore");
 });
});
