import {describe,it,expect} from "vitest";
import {safeCollegeRuleHistory,collegePolicyHistoryHref,collegePolicyHistoryQuery} from "@/modules/module-access/admin-college-rule-history-model";
describe("Super Admin scoped college rule audit projection",()=>{
 it("whitelists actor, module and stored state but never exports arbitrary metadata",()=>{
  const result=safeCollegeRuleHistory([{id:"1",occurredAt:new Date("2026-10-15T12:00:00Z"),actorName:"Admin",metadata:{module:"placements",before:null,after:{enabled:false,locked:true},email:"secret@example.org"}}]);
  expect(result[0]).toMatchObject({module:"placements",change:"Inherit → Off · Locked"});
  expect(JSON.stringify(result)).not.toContain("secret@example.org");
 });
 it("rejects partial or unknown cursor selectors",()=>{
  const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  expect(collegePolicyHistoryQuery.safeParse({beforeId:id}).success).toBe(false);
  expect(collegePolicyHistoryQuery.safeParse({unexpected:"1"}).success).toBe(false);
  const next=collegePolicyHistoryHref(id,{beforeId:id,beforeOccurredAt:new Date("2026-10-15T12:00:00Z")});
  expect(collegePolicyHistoryQuery.safeParse(Object.fromEntries(new URL(next,"https://example.com").searchParams)).success).toBe(true);
 });
});