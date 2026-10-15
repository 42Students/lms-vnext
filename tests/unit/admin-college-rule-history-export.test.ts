import {describe,it,expect} from "vitest";
import {collegePolicyHistoryCsv} from "@/modules/module-access/admin-college-rule-history-export";
describe("college policy audit CSV",()=>{
 it("does not allow spreadsheet formula execution and caps a page at forty rows",()=>{
  const rows=Array.from({length:45},(_,i)=>({at:new Date("2026-10-15T00:00:00Z"),module:i===0?"=WEBSERVICE(1)":"projects",change:"Inherit → On",actorName:i===0?"+SUM(1)":"Admin "+i}));
  const csv=collegePolicyHistoryCsv(rows);
  expect(csv).toContain("'=WEBSERVICE(1)");
  expect(csv).toContain("'+SUM(1)");
  expect(csv.split("\r\n").filter(Boolean)).toHaveLength(41);
  expect(csv).not.toContain("Admin 44");
 });
});
