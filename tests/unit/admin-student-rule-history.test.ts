import {describe,expect,it} from "vitest";
import {safeStudentRuleHistory,studentRuleHistoryCursorSchema,studentRuleHistoryHref,studentRuleHistoryExportHref}
import {studentRuleHistoryCsv} from "@/modules/module-access/admin-student-rule-history-export" from "@/modules/module-access/admin-student-rule-history-model";
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
 it("preserves typed audit module across older cursor links",()=>{
  const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  const url=studentRuleHistoryHref(id,id,{beforeOccurredAt:new Date("2026-10-14T10:30:00Z"),beforeId:id},"electives");
  const query=Object.fromEntries(new URL(url,"https://example.com").searchParams);
  expect(studentRuleHistoryCursorSchema.parse(query).module).toBe("electives");
  expect(studentRuleHistoryCursorSchema.safeParse({module:"placements"}).success).toBe(false);
 });
 it("preserves scoped actor name in learner audit paging without accepting arrays",()=>{
  const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  const url=studentRuleHistoryHref(id,id,null,"projects","Admin A");
  expect(studentRuleHistoryCursorSchema.parse(Object.fromEntries(new URL(url,"https://example.com").searchParams)).actorName).toBe("Admin A");
  expect(studentRuleHistoryCursorSchema.safeParse({actorName:"x".repeat(101)}).success).toBe(false);
 });
 it("enforces validated India-day history date range across pages",()=>{
  const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  expect(studentRuleHistoryCursorSchema.safeParse({from:"2026-10-16",to:"2026-10-15"}).success).toBe(false);
  expect(studentRuleHistoryCursorSchema.safeParse({from:"2026-13-01"}).success).toBe(false);
  const href=studentRuleHistoryHref(id,id,null,"all","","2026-10-01","2026-10-15");
  expect(studentRuleHistoryCursorSchema.parse(Object.fromEntries(new URL(href,"https://example.com").searchParams)).to).toBe("2026-10-15");
 });
 it("exports only projected audit values and guards spreadsheet cells",()=>{
  const csv=studentRuleHistoryCsv([{occurredAt:new Date("2026-10-15T00:00:00Z"),module:"projects",change:"=HYPERLINK(1)",actorName:"+SUM(1)"}]);
  expect(csv).toContain("'=HYPERLINK(1)");
  expect(csv).toContain("'+SUM(1)");
  expect(csv).not.toContain("email");
  const id="92b172ff-3817-44bf-9b48-e9afab2e93d0";
  expect(studentRuleHistoryExportHref(id,id,null,"projects","","","")).toContain("/history/export?module=projects");
 });
 it("guards formulas after leading whitespace and keeps ordinary letters intact",()=>{
  const csv=studentRuleHistoryCsv([{occurredAt:new Date("2026-10-15T00:00:00Z"),module:"electives",change:"  =IMPORTXML(1)",actorName:"Aaron"}]);
  expect(csv).toContain("'  =IMPORTXML(1)");
  expect(csv).toContain("Aaron");
  expect(csv).toContain("\r\n");
  expect(csv).not.toContain("\\r\\n");
 });
});
