import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const code=(path:string)=>readFileSync(path,"utf8");
describe("chat-16 independent audit findings sync evidence",()=>{
 it("SA-placements-projects-120 shows only persisted sync history, never synthetic GitHub sync success",()=>{
  const service=code("src/modules/bug-tracker/independent-audit-findings-service.ts");
  const page=code("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  expect(service).toContain('requireIndependentFindingAccess(context)');
  expect(service).toContain('if(!independentAuditFindingsReady())return null;');
  expect(service).toContain('eq(db10AuditFindingSyncs.source,"42Students/lms-findings")');
  expect(service).toContain('refusedCount:row.refusedFiles.length');
  expect(page).toContain("readIndependentFindingSyncState(ctx)");
  expect(page).toContain("No verified import has been recorded.");
  expect(page).toContain("No sync was performed by opening this page.");
  expect(page).not.toContain("Sync completed successfully");
 });
});
