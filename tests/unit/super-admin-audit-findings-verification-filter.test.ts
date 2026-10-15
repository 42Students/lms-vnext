import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("DB10 production verification filter",()=>{
 it("supports explicitly verified true",()=>expect(input(parse({productionVerified:"YES"})!).productionVerified).toBe(true));
 it("preserves explicitly false",()=>{
  const parsed=input(parse({productionVerified:"NO"})!);
  expect(parsed.productionVerified).toBe(false);
  expect(trackerAdminListSchema.parse(parsed).productionVerified).toBe(false);
 });
 it("keeps Any unset and rejects unrecognized states",()=>{
  expect(input(parse({})!).productionVerified).toBeUndefined();
  expect(parse({productionVerified:"false"})).toBeNull();
 });
});
