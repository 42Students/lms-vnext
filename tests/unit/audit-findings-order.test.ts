import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams,trackerAuditFindingsInput} from "@/modules/bug-tracker/audit-findings-board-model";
describe("audit findings sort",()=>{
 it("allows DB keyset order in either direction",()=>{
  expect(trackerAuditFindingsInput(parseAuditFindingsSearchParams({sort:"oldest"})!).sort).toBe("oldest");
  expect(trackerAuditFindingsInput(parseAuditFindingsSearchParams({})!).sort).toBe("newest");
  expect(parseAuditFindingsSearchParams({sort:"random"})).toBeNull();
 });
});