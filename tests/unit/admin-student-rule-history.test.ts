import {describe,expect,it} from "vitest";
import {safeStudentRuleHistory,studentRuleHistoryCursorSchema,studentRuleHistoryHref} from "@/modules/module-access/admin-student-rule-history-model";
describe("Super Admin student rule audit projection",()=>{
 it("only projects valid values and omits arbitrary metadata",()=>{
  const output=safeStudentRuleHistory([{id:"1",occurredAt:new Date("2026-10-15T00:00:00Z"),summary:"",
   actorName:"Admin",metadata:{module:"projects",before:null,after:{enabled:false,locked:true},email:"secret@example.com"}}]);
  expect(output[0]).toMatchObject({module:"projects",change:"Inherit → Off · Locked"});
  expect(JSON.stringify(output)).not.toContain("secret@example.com");
 });
 it("does not trust unclassified module labels",()=>{
  expect(safeStudentRuleHistory([{id:"1",occurredAt:new Date(),summary:"",actorName:null,metadata:{module:"unknown",before:"bad",after:"bad"}}])[0].module).toBe("Optional module");
 });
 it("rejects missing cursor half and unknown history query keys",()=>{
  const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  expect(studentRuleHistoryCursorSchema.safeParse({beforeId:id}).success).toBe(false);
  expect(studentRuleHistoryCursorSchema.safeParse({ignored:"1"}).success).toBe(false);
  const url=studentRuleHistoryHref(id,id,{beforeOccurredAt:new Date("2026-10-14T10:30:00Z"),beforeId:id});
  const query=Object.fromEntries(new URL(url,"https://example.com").searchParams);
  expect(studentRuleHistoryCursorSchema.safeParse(query).success).toBe(true);
 });
});
