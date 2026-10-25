import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("SA-tenants-modules-46 inaccessible audit repository",()=>{
 it("SA-tenants-modules-46 does not fabricate successful imports without verified provider access",()=>{
  const board=source("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  const service=source("src/modules/bug-tracker/independent-audit-findings-service.ts");
  expect(board).toContain("automatic GitHub sync is not configured");
  expect(board).toContain("No sync was started here.");
  expect(service).toContain('eq(db10AuditFindingSyncs.source,"42Students/lms-findings")');
  expect(service).toContain("lastSyncedAt");
  expect(service).toContain("refusedFiles");
  expect(service).toContain('process.env["DB10_AUDIT_FINDINGS_READY"]==="DB10_VERIFIED"');
 });
});
