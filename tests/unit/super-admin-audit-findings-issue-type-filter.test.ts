import {describe,it,expect} from "vitest";
import {parseAuditFindingsSearchParams as parse,trackerAuditFindingsInput as input} from "@/modules/bug-tracker/audit-findings-board-model";
import {trackerAdminListSchema} from "@/modules/bug-tracker/admin-validation";
describe("DB10 audit findings issue type",()=>{
 it("keeps exact persisted type and trims whitespace",()=>{
  const parsed=parse({issueType:"  UI Regression "});
  expect(parsed?.issueType).toBe("UI Regression");
  expect(trackerAdminListSchema.parse(input(parsed!)).issueType).toBe("UI Regression");
 });
 it("treats empty selection as unfiltered",()=>expect(input(parse({issueType:""})!).issueType).toBeUndefined());
 it("rejects oversized and repeated values",()=>{
  expect(parse({issueType:"x".repeat(81)})).toBeNull();
  expect(parse({issueType:["a","b"]})).toBeNull();
 });
});
