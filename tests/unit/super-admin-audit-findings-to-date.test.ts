import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("Audit Findings IST inclusive end date",()=>{
 it("computes exclusive next day start in UTC",()=>{
  const value=input(parse({fromDate:"2026-10-15",toDate:"2026-10-15"})!);
  expect(value.createdFrom?.toISOString()).toBe("2026-10-14T18:30:00.000Z");
  expect(value.createdBefore?.toISOString()).toBe("2026-10-15T18:30:00.000Z");
  expect(trackerAdminListSchema.safeParse(value).success).toBe(true);
 });
 it("rejects reversed range and impossible day",()=>{
  expect(parse({fromDate:"2026-10-15",toDate:"2026-10-14"})).toBeNull();
  expect(parse({toDate:"2026-13-03"})).toBeNull();
 });
 it("supports end-date-only query",()=>expect(input(parse({toDate:"2026-10-15"})!).createdFrom).toBeUndefined());
});
