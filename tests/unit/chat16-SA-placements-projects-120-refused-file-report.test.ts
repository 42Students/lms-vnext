import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");

describe("SA-placements-projects-120 authenticated import refusal reporting",()=>{
 it("SA-placements-projects-120 only reads persisted GitHub-import audit state for a globally scoped Super Admin",()=>{
  const service=src("src/modules/bug-tracker/independent-audit-findings-service.ts");
  expect(service).toContain("readIndependentFindingSyncState(context:RequestContext)");
  expect(service).toContain("requireIndependentFindingAccess(context)");
  expect(service).toContain('eq(db10AuditFindingSyncs.source,"42Students/lms-findings")');
  expect(service).toContain("refusedCount:Math.max(row.refusedFiles.length,refusedFiles.length),refusedFiles");
  expect(service).toContain("row.refusedFiles.slice(0,200)");
  expect(service).toContain(".slice(0,240)");
  expect(service).toContain(".slice(0,400)");
 });
 it("SA-placements-projects-120 displays refused files and reasons without claiming an unperformed successful sync",()=>{
  const page=src("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  expect(page).toContain("Files the importer refused or flagged");
  // DataTable replaced the hand-rendered list so mobile rows remain accessible.
  expect(page).toContain("const refusedColumns:DataTableColumn");
  expect(page).toContain("rows={sync.refusedFiles}");
  expect(page).toContain("getRowKey={item=>item.path+");
  expect(page).toContain("caption=\"Files the importer refused or flagged\"");
  expect(page).toContain('key:"reason",header:"Why"');
  expect(page).toContain("Sync isn't set up on this server.");
  expect(page).toContain("The last sync failed.");
  expect(page).toContain("No sync was started here.");
  expect(page).toContain("Showing the first ");
  expect(page).not.toContain("Sync completed successfully");
 });
});