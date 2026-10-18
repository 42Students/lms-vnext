import {describe,expect,it} from "vitest";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
import type {MessagingHistoryRow} from "@/modules/messaging/receipt-history-model";

function exportPurpose(purpose:string){
 const rows:MessagingHistoryRow[]=[{
  id:"11111111-1111-4111-8111-111111111111",purpose,
  total:1,queued:0,sent:1,failed:0,suppressed:0,
  createdAt:new Date("2026-10-18T09:30:00.000Z"),finalizedAt:new Date("2026-10-18T09:35:00.000Z"),
 }];
 return messagingHistoryCsv(rows,1);
}

describe("T-S2-04 recruiter campaign export CSV injection and privacy",()=>{
 it.each([
  "=HYPERLINK(\"https://evil.test\")",
  "  =SUM(1,1)",
  "\t@cmd",
  "\r\n+1+1",
  "\u200b=1+1",
  " \u0000-7+7",
 ])("escapes spreadsheet formulas even after leading hidden whitespace: %j",(purpose)=>{
  const csv=exportPurpose(purpose);
  const escaped='"'+"'"+purpose.replaceAll('"','""')+'"';
  expect(csv).toContain(escaped);
 });
 it("does not alter safe CRM purpose text or disclose recipient identifiers",()=>{
  const csv=exportPurpose('Hiring "2026", October');
  expect(csv).toContain('"Hiring ""2026"", October"');
  expect(csv).not.toContain('"\'Hiring');
  expect(csv).toContain('"provider_accepted"');
  expect(csv).toContain('"1","0","1","0","0"');
  expect(csv).not.toContain("recipient_email");
  expect(csv).not.toContain("phone");
  expect(csv.endsWith("\r\n")).toBe(true);
 });
});
