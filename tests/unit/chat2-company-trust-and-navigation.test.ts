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
  expect(switchSource).toContain("Trusted: their drive requests go live without review");
  expect(switchSource).toContain("Their drive requests come to you for review");
  expect(switchSource).toContain("Their drive requests go live without your review.");
  expect(switchSource).toContain("Couldn't save. Refresh and try again.");
  expect(switchSource).toContain("pending.current");
  expect(detail).toContain("TpoCompanyTrustSwitch");
 });
 it("TPO-companies-20 defaults bare Companies to legacy Engage but preserves named and filtered company views",()=>{
  const route=source("src/app/(authenticated)/tpo/companies/page.tsx");
  const engage=source("src/app/(authenticated)/tpo/recruiters/page.tsx");
  expect(route).toContain('redirect("/tpo/recruiters?view=companies")');
  expect(route).toContain('first(raw.directory)!=="1"');
  expect(route).toContain('if (name) {');
  expect(route).toContain("TpoCompanyMemoryWorkspace");
  expect(engage).toContain('requested === "board" || requested === "companies"');
 });
 it("TPO-companies-22 retains verified company numbers and no-activity label",()=>{
  const workspace=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(workspace).toContain('aria-label="Company numbers"');
  expect(workspace).toContain("no activity yet");
  expect(workspace).toContain("Drives that ran");
  expect(workspace).toContain("students placed");
 });
});