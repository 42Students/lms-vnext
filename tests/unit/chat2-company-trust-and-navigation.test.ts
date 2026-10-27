import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("Chat-2 Company relationship and legacy Companies navigation",()=>{
 it("TPO-companies-03 persists Trusted as a scoped, versioned toggle and shows legacy outcomes",()=>{
  const switchSource=source("src/components/placements/tpo-company-trust-switch.tsx");
  const detail=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(switchSource).toContain('action:"EDIT_TRUST",confirmed:true,nextTrusted:!trusted');
  expect(switchSource).toContain("expectedUpdatedAt:version");
  expect(switchSource).toContain("College trust saved. Direct publishing still requires a verified company, a current recruiter grant and college policy approval.");
  expect(switchSource).toContain("College trust removed. Future recruiter requests must follow the current review policy.");
  expect(switchSource).toContain("Trust is a college decision, not platform verification.");
  expect(switchSource).toContain("Couldn't save. Refresh and try again.");
  expect(switchSource).toContain("pending.current");
  expect(detail).toContain("TpoCompanyTrustSwitch");
 });
 it("TPO-companies-20 defaults bare Companies to legacy Engage but preserves named and filtered company views",()=>{
  const route=source("src/app/(authenticated)/tpo/companies/page.tsx");
  const engage=source("src/app/(authenticated)/tpo/recruiters/page.tsx");
  expect(route).toContain("await requireTpoBatchActor(context)");
  expect(route).toContain("<TpoCompaniesSpreadsheet rows={page.items}/>");
  expect(route).toContain('href="/tpo/recruiters"');
  expect(route).toContain('if (name) {');
  expect(route).toContain("TpoCompanyMemoryWorkspace");
  expect(engage).toContain('requested === "board" || requested === "companies"');
 });
 it("TPO-companies-29 keeps accessible phone cards and per-company data without a second roster",()=>{
  const page=source("src/app/(authenticated)/tpo/companies/page.tsx");
  const table=source("src/components/ui/data-table.tsx");
  expect(page).toContain('<TpoCompaniesSpreadsheet rows={page.items}/>');
  const sheet=source("src/components/tpo/tpo-companies-spreadsheet.tsx");
  expect(sheet).toContain('label:"Confirmed joins"');
  expect(sheet).toContain('read:company=>company.confirmedJoinedLearners');
  expect(sheet).toContain('href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}');
  // The shared Quartz grid now owns phone cards and expandable columns.
  expect(sheet).toContain('<GridWorkspace rows={rows} columns={columns}');
  expect(sheet).toContain('openPrimary={{');
  expect(sheet).toContain('rowActions={company=>');
  expect(sheet).toContain('storageKey="tpo-company-directory-columns-v1"');
  expect(table).toContain('mobilePriority');
  const canonical=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(canonical).toContain('caption="Company placement drives"');
  expect(canonical).toContain('caption="Company hiring history"');
  expect(canonical).toContain('PUBLISHED:"Live",CLOSED:"Completed"');
  expect(canonical).toContain('href={"/tpo/placements/jobs/"+encodeURIComponent(offer.jobId)}');
 });
 it("TPO-companies-22 retains verified company numbers and no-activity label",()=>{
  const workspace=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(workspace).toContain('aria-label="Company numbers"');
  expect(workspace).toContain("no activity yet");
  expect(workspace).toContain("Drives that ran");
  expect(workspace).toContain("students placed");
 });
});