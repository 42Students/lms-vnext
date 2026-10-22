import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {parseIndependentFindingFilters,independentFindingHref} from "@/modules/bug-tracker/independent-audit-findings-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("SA-tenants-modules-48 persisted board filter states",()=>{
 it("SA-tenants-modules-48 validates the legacy open/release/all views and multi-select facets",()=>{
  const parsed=parseIndependentFindingFilters({view:"RELEASE",status:["NEW","IN_PROGRESS"],
   severity:["CRITICAL","HIGH"],kind:["BUG","SECURITY"],area:"courses",page:"2"});
  expect(parsed).not.toBeNull();
  if(!parsed)return;
  expect(independentFindingHref(parsed)).toContain("view=RELEASE");
  expect(independentFindingHref(parsed)).toContain("status=NEW");
  expect(independentFindingHref(parsed)).toContain("status=IN_PROGRESS");
  expect(independentFindingHref(parsed)).toContain("kind=SECURITY");
  expect(parseIndependentFindingFilters({status:["UNSAFE"]})).toBeNull();
 });
 it("SA-tenants-modules-48 calculates counts from SQL-scoped full matches, not one displayed page",()=>{
  const service=source("src/modules/bug-tracker/independent-audit-findings-service.ts");
  const page=source("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  expect(service).toContain("db10AuditFindings.sourcePath");
  expect(service).toContain("db10AuditFindings.paths}::text");
  expect(service).toContain("const where=and(...predicates)");
  expect(service).toContain(".from(db10AuditFindings)");
  expect(service).toContain(".where(where)");
  expect(service).toContain("These dashboard facets summarize ALL imported findings");
  expect(service).not.toContain("\\ if(query.view");
  expect(service).toContain("statusCounts");
  expect(service).toContain("criticalOpen");
  expect(service).toContain(".groupBy(db10AuditFindings.status,db10AuditFindings.severity)");
  expect(service).toContain("requireIndependentFindingAccess(context)");
  expect(page).toContain('label="Open findings by severity"');
  expect(page).toContain('data.severityOpenCounts[severity]??0');
  expect(page).toContain('label="Finding status"');
  expect(page).toContain('data.statusCounts[status]??0');
  expect(page).toContain('independentFindingHref({...parsed,view:"ALL",statuses:[status],page:1})');
 });
});
