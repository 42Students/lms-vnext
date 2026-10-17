import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoRequestFailedRowsTsv} from "@/modules/placements/tpo-request-failed-rows-model";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO bulk request failure recovery",()=>{
 it("TPO-requests-verification-13 offers a failed-row copy action and preserves rejected rows for review",()=>{
  const ui=source("src/components/placements/tpo-request-bulk-decision.tsx");
  expect(ui).toContain("Copy failed");
  expect(ui).toContain("tpoRequestFailedRowsTsv(outcomes)");
  expect(ui).toContain("Could not copy failed requests. Check browser clipboard permissions.");
  expect(ui).toContain('results.some(result=>result.id===id&&result.status==="updated")');
 });
 it("TPO-requests-verification-13 filters out decided rows and escapes spreadsheet formulas",()=>{
  const result=tpoRequestFailedRowsTsv([
   {id:"a",name:"=HYPERLINK(1)",status:"failed",message:"Try again\nwait"},
   {id:"b",name:"Unchanged",status:"updated",message:"Approved"},
  ]);
  expect(result).toBe("Student\tRequest ID\tOutcome\n'=HYPERLINK(1)\ta\tTry again wait");
  expect(tpoRequestFailedRowsTsv([{id:"b",name:"Safe",status:"updated",message:"Done"}])).toBe("");
 });
});
