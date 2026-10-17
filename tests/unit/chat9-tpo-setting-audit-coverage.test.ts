import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO settings audit writer coverage",()=>{
 it("TPO-settings-audit-99 records every implemented college-level setting mutation in the same transaction",()=>{
  const policy=source("src/modules/placements/tpo-policy-service.ts");
  const communication=source("src/modules/placements/tpo-communication-settings-service.ts");
  const trusted=source("src/modules/placements/tpo-trusted-domains-write-service.ts");
  const publicLink=source("src/modules/placements/tpo-public-join-link-service.ts");
  const recruiter=source("src/modules/placements/tpo-recruiter-grant-write-service.ts");
  const outcome=source("src/modules/placements/tpo-outcome-label-settings-service.ts");
  for(const token of ["placements.tpo_college_rules.changed","placements.tpo_company_visibility.changed"])
   expect(policy).toContain(token);
  expect(communication).toContain('eventType:"placements.tpo_communication_setting.updated"');
  expect(trusted).toContain("placements.tpo.trusted_domain_changed");
  expect(publicLink).toContain("PLACEMENTS_PUBLIC_RECRUITER_LINK_CHANGED");
  expect(publicLink).toContain("PLACEMENTS_PUBLIC_JOIN_LINK_ENABLED");
  for(const name of ["PLACEMENTS_RECRUITER_ACCESS_GRANTED","PLACEMENTS_RECRUITER_ACCESS_EXTENDED","PLACEMENTS_RECRUITER_ACCESS_REVOKED"])
   expect(recruiter).toContain(name);
  expect(outcome).toContain("placements.tpo_outcome_labels.updated");
  for(const s of [policy,communication,trusted,publicLink,recruiter,outcome]){
   expect(s).toContain("activityEvents");
   expect(s).toContain("transaction(");
  }
 });
});
