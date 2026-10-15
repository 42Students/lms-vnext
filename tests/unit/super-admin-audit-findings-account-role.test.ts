import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("DB10 audit findings account-role filter",()=>{
 it.each(["LEARNER","FACULTY","MENTOR","COLLEGE_ADMIN","SUPER_ADMIN","NOT_SURE"])("supports %s",role=>{
  const parsed=parse({accountRole:role});expect(parsed?.accountRole).toBe(role);
  expect(trackerAdminListSchema.safeParse(input(parsed!)).success).toBe(true);
 });
 it("does not constrain the default All selector",()=>{
  const value=input(parse({})!);expect(value.accountRole).toBeUndefined();
 });
 it("fails closed for arbitrary account roles",()=>{
  expect(parse({accountRole:"HR"})).toBeNull();
  expect(parse({accountRole:["LEARNER","FACULTY"]})).toBeNull();
 });
});
