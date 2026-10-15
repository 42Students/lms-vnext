import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams,trackerAuditFindingsInput} from "@/modules/bug-tracker/audit-findings-board-model";
describe("audit findings environment filter",()=>{
 it("maps strict environment to backend DB query while keeping all unrestricted",()=>{
  expect(trackerAuditFindingsInput(parseAuditFindingsSearchParams({environment:"UAT"})!)).toMatchObject({environment:"UAT"});
  expect(trackerAuditFindingsInput(parseAuditFindingsSearchParams({})!).environment).toBeUndefined();
  expect(parseAuditFindingsSearchParams({environment:"STAGING"})).toBeNull();
 });
});