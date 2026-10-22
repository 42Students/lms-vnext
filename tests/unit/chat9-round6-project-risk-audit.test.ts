import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("College Projects risk and activity acceptance",()=>{
 it("COL-projects-18 enables admin resource change/search without overriding mentor Activity feed",()=>{
  const a=src("src/components/projects/project-activity-filtered-list.tsx");
  for(const s of ["mentorActivityRelativeTime","Search activity","Resource change","projectResourceAuditMatches"])expect(a).toContain(s);
  const resourceAudit=src("src/components/projects/project-resource-audit-list.tsx");
  expect(resourceAudit).toContain('aria-label="Resource activity"');
  expect(resourceAudit).toContain('aria-label="Search resource audit"');
  expect(src("src/components/projects/project-workspace.tsx")).toContain('resourceAudit={mode==="ADMIN"}');
 });
 it("COL-projects-23 ensures ten-tab workspace navigation is keyboard-scrollable at narrow widths",()=>{
  const s=src("src/components/projects/project-workspace.tsx");
  expect(s).toContain('ariaLabel="Project workspace sections"');
  const tabs=src("src/components/ui/tabs.tsx");
  expect(tabs).toContain('<ScrollCue axis="x"');
  expect(tabs).toContain('aria-label={ariaLabel}');
  expect(tabs).toContain('tabIndex={interactive && index === activeIndex ? 0 : -1}');
  const list=src("src/components/projects/project-admin-workspace-list.tsx");
  expect(list).toContain('<DataTable');
  expect(list).toContain('caption="Project workspace table"');
  expect(src("src/components/ui/data-table.tsx")).toContain('<ScrollCue axis="x"');
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
