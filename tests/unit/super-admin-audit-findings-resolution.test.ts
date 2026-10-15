import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("DB10 tracker resolution filter",()=>{
 it.each(["FIXED","DUPLICATE","NOT_A_BUG","CANNOT_REPRODUCE","WONT_FIX","UNRESOLVED"])("accepts %s",resolution=>{
  const value=input(parse({resolution})!);
  expect(value.resolution).toBe(resolution);expect(trackerAdminListSchema.safeParse(value).success).toBe(true);
 });
 it("omits default resolution selector",()=>expect(input(parse({})!).resolution).toBeUndefined());
 it("denies unknown resolution",()=>expect(parse({resolution:"UNKNOWN"})).toBeNull());
});
