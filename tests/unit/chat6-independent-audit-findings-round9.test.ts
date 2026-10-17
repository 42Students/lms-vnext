import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {parseIndependentFindingFilters,independentFindingHref,INDEPENDENT_AUDIT_PAGE_SIZE} from "../../src/modules/bug-tracker/independent-audit-findings-model";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Independent Super Admin audit findings",()=>{
 it("SA-placements-projects-119 never substitutes bug tracker issues for independent audit findings",()=>{
  const service=source("src/modules/bug-tracker/independent-audit-findings-service.ts");
  const page=source("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  const detail=source("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(service).toContain('from "@/db/schema/db10-audit-findings.draft"');
  expect(service).toContain("db10AuditFindings");
  expect(service).toContain("DB10_AUDIT_FINDINGS_READY");
  expect(service).toContain("context.adminScope?.collegeId||context.adminScope?.organizationId");
  expect(page).toContain('title:"Audit findings · 42 Tracker"');
  expect(page).toContain('title="Audit findings"');
  expect(page).toContain("Bug reports are not substituted for independent audit findings.");
  expect(page).not.toContain("listBugTrackerIssuesForAdmin");
  expect(detail).toContain("getIndependentAuditFinding");
  expect(detail).not.toContain("TrackerIssueDetailPage");
 });
 it("SA-placements-projects-122 provides Open Release All, multi filters and bounded 50-row paging",()=>{
  const parsed=parseIndependentFindingFilters({status:["NEW","IN_PROGRESS"],severity:["CRITICAL","HIGH"],kind:["BUG"],area:"Courses",view:"RELEASE",page:"2"});
  expect(parsed).not.toBeNull();
  const href=independentFindingHref(parsed!);
  for(const part of ["view=RELEASE","status=NEW","status=IN_PROGRESS","severity=CRITICAL","severity=HIGH","kind=BUG","page=2"])expect(href).toContain(part);
  expect(parseIndependentFindingFilters({status:["BAD"]})).toBeNull();
  expect(parseIndependentFindingFilters({q:["a","b"]})).toBeNull();
  expect(INDEPENDENT_AUDIT_PAGE_SIZE).toBe(50);
  const service=source("src/modules/bug-tracker/independent-audit-findings-service.ts");
  expect(service).toContain('["CRITICAL","HIGH"]');
  expect(service).toContain("INDEPENDENT_AUDIT_PAGE_SIZE");
  const page=source("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  for(const phrase of ['name="status" multiple','name="severity" multiple','name="kind" multiple','Finding views','Assigned','Reported'])expect(page).toContain(phrase);
 });
});