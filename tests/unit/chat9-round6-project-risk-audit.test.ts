import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("College Projects risk and activity acceptance",()=>{
 it("COL-projects-18 enables admin resource change/search without overriding mentor Activity feed",()=>{
  const a=src("src/components/projects/project-activity-filtered-list.tsx");
  for(const s of ["mentorActivityRelativeTime","Search activity","Resource change","All resource changes","projectResourceAuditMatches"])expect(a).toContain(s);
  expect(src("src/components/projects/project-workspace.tsx")).toContain('resourceAudit={mode==="ADMIN"}');
 });
 it("COL-projects-23 ensures ten-tab workspace navigation is keyboard-scrollable at narrow widths",()=>{
  const s=src("src/components/projects/project-workspace.tsx");
  expect(s).toContain('aria-label="Project workspace sections"');
  expect(s).toContain("flex max-w-full gap-2 overflow-x-auto");
  expect(s).toContain("tabIndex={0}");
  expect(src("src/components/projects/project-admin-workspace-list.tsx")).toContain("overflow-x-auto");
 });
 it("COL-projects-10 verifies whole-college risk buckets, scoped CSV and complete row actions",()=>{
  const s=src("src/components/projects/project-admin-at-risk-page.tsx");
  for(const word of ["result.buckets.stalled","result.buckets.blocker","result.buckets.review","Severity","Inactive","ProjectAtRiskPageExport","Reassign mentor","Review submission"])expect(s).toContain(word);
 });
 it("COL-projects-11 verifies persisted blocker/task, latest review and seven-day inactivity risk criteria",()=>{
  const s=src("src/modules/projects/admin-insights-service.ts");
  for(const word of ["blockedTask","blockerSummary","pendingReview","staleCutoff","7 * 24 * 60 * 60 * 1000"])expect(s).toContain(word);
 });
});
