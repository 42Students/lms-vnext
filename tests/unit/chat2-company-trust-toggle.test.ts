import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO companies trusted relationship",()=>{
 it("TPO-companies-03 exposes legacy switch inline without mutating global company identity",()=>{
  const page=src("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  const control=src("src/components/placements/tpo-company-trust-switch.tsx");
  expect(page).toContain("TpoCompanyTrustSwitch");
  expect(page).toContain('lifecycle?.status==="ACTIVE"');
  expect(control).toContain("Direct publishing also requires an active recruiter grant and college policy approval.");
  expect(control).toContain("Future recruiter requests must follow the current review policy.");
  expect(control).toContain("Trust is a college decision, not platform verification.");
 });
 it("TPO-companies-03 keeps guarded audited optimistic-version write and no raw server codes",()=>{
  const ui=src("src/components/placements/tpo-company-trust-switch.tsx");
  const service=src("src/modules/placements/tpo-company-lifecycle-service.ts");
  expect(ui).toContain('action:"EDIT_TRUST",confirmed:true');
  expect(ui).toContain('expectedUpdatedAt:version');
  expect(ui).toContain("Couldn't save. Refresh and try again.");
  expect(service).toContain('eventType: "PLACEMENTS_COMPANY_LIFECYCLE_CHANGED"');
 });
});
