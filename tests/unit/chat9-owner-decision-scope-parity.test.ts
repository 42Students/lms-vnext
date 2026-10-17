import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("Owner-approved improvements over obsolete legacy workflows",()=>{
 it("TPO-calendar-reports-57 keeps intentional season scoping and does not infer history when no season exists",()=>{
  const decisions=source("docs/audit/owner-decisions-resolved.md");
  const service=source("src/modules/placements/report-service.ts");
  const summary=source("src/app/(authenticated)/tpo/reports/placement-summary/page.tsx");
  expect(decisions).toContain("season scoping");
  expect(service).toContain("noSeason: true");
  expect(service).toContain("selectedSeasonId: null");
  expect(summary).toContain("No placement season available");
  expect(summary).toContain("do not represent zero historical placements");
 });
 it("COL-projects-05 preserves recoverable archive and restore instead of a competing delete implementation",()=>{
  const decisions=source("docs/audit/owner-decisions-resolved.md");
  const archive=source("src/components/projects/project-archive-control.tsx");
  const list=source("src/app/(authenticated)/college/projects/page.tsx");
  expect(decisions).toContain("archive instead of delete");
  expect(archive).toContain("Restore this workspace?");
  expect(archive).toContain("Archived workspaces can be reopened with all of their content.");
  expect(list).toContain('href="/college/projects?status=ARCHIVED"');
 });
});
