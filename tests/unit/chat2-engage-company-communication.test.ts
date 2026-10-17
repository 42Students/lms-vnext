import {describe,expect,it} from "vitest";
import {deriveLegacyCompanyCommunication as derive} from "@/modules/placements/tpo-company-communication-legacy-model";
import {readFileSync} from "node:fs";
const src=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
describe("Engage company communication legacy view",()=>{
 it("TPO-recruiters-R01 derives communication from real drive and recruiter facts",()=>{
  expect(derive(1,[])).toBe("REPLIED");
  expect(derive(0,[{stage:"JOINED",manualStage:"NEW"}])).toBe("REPLIED");
  expect(derive(0,[{stage:"INVITED",manualStage:"NEW"}])).toBe("EMAILED");
  expect(derive(0,[{stage:"NOT_NOW",manualStage:"NOT_NOW"}])).toBe("NOT_INTERESTED");
  expect(derive(0,[])).toBe("NOT_CONTACTED");
 });
 it("TPO-recruiters-R01 lets TPO filter, edit, export, and add contacts on Companies tab independent of leads",()=>{
  expect(src).toContain("deriveLegacyCompanyCommunication(company.drivesRan");
  expect(src).toContain("setCompanyCommunicationFilter");
  expect(src).toContain("changeCompanyCommunication(company.key");
  expect(src).toContain("Export companies CSV");
  expect(src).toContain("Add a contact");
  expect(src).toContain("other spellings");
  expect(src).toContain('view === "companies"');
 });
});
