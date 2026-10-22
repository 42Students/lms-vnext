import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

function code(path:string){return readFileSync(path,"utf8");}

describe("lane-2 wave 3 retained legacy report and audit actions",()=>{
 it("pins each normalized company subtotal and an all-company footer beneath the hiring table",()=>{
  const file=code("src/components/placements/college-hiring-funnel.tsx");
  expect(file).toContain("data.normalizedCompanySubtotals.map(company");
  expect(file).toContain('<tfoot className="sticky bottom-0');
  expect(file).toContain("company.byStage[stage]??0");
  expect(file).toContain("All companies");
 });
 it("places the retention check and learner lookup before optional administration panels",()=>{
  const file=code("src/components/placements/placement-operations-workspace.tsx");
  const snapshot=file.indexOf("<PlacementOperationsSnapshot");
  const retention=file.indexOf("<AdminRetentionInlinePreview");
  const lookup=file.indexOf('title="Student placement lookup"');
  const season=file.indexOf('title="Placement season"');
  expect(snapshot).toBeGreaterThan(0);
  expect(retention).toBeGreaterThan(snapshot);
  expect(lookup).toBeGreaterThan(retention);
  expect(season).toBeGreaterThan(lookup);
  expect(file).toContain('basePath+"/student-lookup"');
 });
 it("offers authorized manual GitHub synchronization only when configured",()=>{
  const page=code("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  const control=code("src/components/tracker/independent-findings-sync-control.tsx");
  expect(page).toContain('requirePermission(ctx,"admin-scope.select")');
  expect(page).toContain("independentAuditImporterReady()&&independentAuditGithubConfigured()");
  expect(page).toContain("<IndependentFindingsSyncControl ready={importerReady}");
  expect(control).toContain('disabled={!ready||pending}');
  expect(control).toContain('method:"POST"');
  expect(control).toContain('Repository importer is not verified or configured');
 });
});
