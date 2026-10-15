import {describe,it,expect} from "vitest";
import {collegePolicyHistoryHref} from "@/modules/module-access/admin-college-rule-history-model";
describe("Super Admin feature history links",()=>{
 it("retains a scoped UUID and selected audit page cursor for CSV",()=>{
  const college="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  const url=collegePolicyHistoryHref(college,{beforeId:college,beforeOccurredAt:new Date("2026-10-15T10:00:00Z")});
  expect(url.replace("/history","/history/export")).toContain("/history/export?beforeOccurredAt=");
  expect(url).toContain("beforeId="+college);
 });
 it("never advances an export to the next page cursor",()=>{
  const college="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  const current={beforeId:college,beforeOccurredAt:new Date("2026-10-15T09:00:00Z")};
  const newerPage=collegePolicyHistoryHref(college,current).replace("/history","/history/export");
  const firstPage=collegePolicyHistoryHref(college,null).replace("/history","/history/export");
  expect(newerPage).toContain("beforeId="+college);
  expect(firstPage).not.toContain("beforeId=");
 });
});
