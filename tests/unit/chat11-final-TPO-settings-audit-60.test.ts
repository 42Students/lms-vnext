import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {tpoRecruiterGrantCsv,tpoRecruiterGrantExportHref} from "@/modules/placements/tpo-recruiter-grant-export-model";
import type {TpoRecruiterGrantView} from "@/modules/placements/tpo-recruiter-access-model";
describe("TPO recruiter grant final sprint export",()=>{
 it("TPO-settings-audit-60 preserves scoped CSV headers, privacy and the recruiters filename",()=>{
  const item:TpoRecruiterGrantView={displayName:"=MALICIOUS()",companyName:"Example",
   designation:null,status:"ACTIVE",grantedDate:"18 Oct 2026",revokedDate:null,
   validUntilDate:"19 Oct 2026",ended:false,capabilities:["DRIVES"],
   verificationStatus:"VERIFIED"};
  const csv=tpoRecruiterGrantCsv([item],false);
  expect(csv).toContain("Recruiter");
  expect(csv).toContain("Company");
  expect(csv).toContain("Grant status");
  expect(csv).not.toContain("phone");
  expect(csv).not.toContain("contact");
  expect(csv).toContain("MALICIOUS()");
  const exportRoute=readFileSync("src/app/api/placements/tpo/settings/recruiter-grants/export/route.ts","utf8");
  expect(exportRoute).toContain('filename="recruiters.csv"');
  expect(exportRoute).toContain("listTpoRecruiterAccess(await getCurrentRequestContext()");
  expect(exportRoute).toContain("private, no-store");
  expect(tpoRecruiterGrantExportHref({status:"REVOKED",q:"Example"})).toContain("status=REVOKED");
 });
});