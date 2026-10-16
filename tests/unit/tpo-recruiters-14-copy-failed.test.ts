import {describe,it,expect} from "vitest";
import {tpoBulkFailedLines,tpoBulkFailedSummary} from "@/modules/placements/tpo-bulk-failed-result-model";
const rows=[
 {leadId:"one",status:"updated" as const,reason:null},
 {leadId:"two",status:"ineligible" as const,reason:"Stage changed"},
 {leadId:"three",status:"unchanged" as const,reason:null},
];
describe("TPO-recruiters-14 bulk result copy and retry boundaries",()=>{
 it("copies only ineligible lines, not successfully updated leads",()=>{
  expect(tpoBulkFailedLines(rows)).toHaveLength(1);
  expect(tpoBulkFailedSummary(rows)).toBe("two — Stage changed");
 });
 it("does not invent a retry for results that all succeeded",()=>{
  expect(tpoBulkFailedSummary(rows.filter(row=>row.status==="updated"))).toBe("No failed recruiter leads.");
 });
});
