import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("Audit Findings inclusive IST start day",()=>{
 it("starts at India midnight in UTC",()=>{
  const filters=input(parse({fromDate:"2026-10-15"})!);
  expect(filters.createdFrom?.toISOString()).toBe("2026-10-14T18:30:00.000Z");
  expect(trackerAdminListSchema.safeParse(filters).success).toBe(true);
 });
 it("rejects impossible or malformed dates",()=>{
  expect(parse({fromDate:"2026-02-30"})).toBeNull();
  expect(parse({fromDate:"tomorrow"})).toBeNull();
 });
 it("keeps default unrestricted",()=>expect(input(parse({})!).createdFrom).toBeUndefined());
});
