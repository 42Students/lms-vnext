import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("DB10 audit findings retest state",()=>{
 it.each(["NOT_RETESTED","PASS","FAIL"])("preserves %s",retestStatus=>{
  const filters=input(parse({retestStatus})!);
  expect(filters.retestStatus).toBe(retestStatus);expect(trackerAdminListSchema.safeParse(filters).success).toBe(true);
 });
 it("supports unconstrained default",()=>expect(input(parse({})!).retestStatus).toBeUndefined());
 it("denies unknown retest states",()=>expect(parse({retestStatus:"IN_PROGRESS"})).toBeNull());
});
