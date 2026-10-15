import {describe,expect,it} from "vitest";
import {safeStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-model";
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
});
