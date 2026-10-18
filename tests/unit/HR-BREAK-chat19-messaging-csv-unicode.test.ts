import {describe,expect,it} from "vitest";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
import type {MessagingHistoryRow} from "@/modules/messaging/receipt-history-model";

const date=new Date("2026-10-18T10:00:00.000Z");
const makeRow=(purpose:string):MessagingHistoryRow=>({
  id:"11111111-1111-4111-8111-111111111111",
  purpose,total:2,queued:0,sent:1,failed:1,suppressed:0,
  createdAt:date,finalizedAt:null,
});

describe("HR-BREAK-MESSAGING-CSV-02: Unicode-safe, aggregate-only TPO history exports",()=>{
 it.each([
  "\u2060=HYPERLINK(\"https://evil.invalid\")",
  "\u200D+SUM(A1:B1)",
  "\uFEFF@IMPORT(1)",
  "\u2028=1+1",
  "\u2029-1+1",
  "\u00A0=SUM(A1)",
  "\r\n\u200B=cmd",
 ])("neutralizes hidden Unicode prefix %j before spreadsheet evaluation",purpose=>{
  const csv=messagingHistoryCsv([makeRow(purpose)],1);
  expect(csv).toContain("\"'"+purpose.replaceAll('"','""')+"\"");
 });
 it("retains ordinary aggregate totals and does not include recipient PII",()=>{
  const csv=messagingHistoryCsv([makeRow("Campus placement updates")],1);
  expect(csv).toContain('"provider_accepted"');
  expect(csv).toContain('"Campus placement updates"');
  expect(csv).not.toContain('"\'Campus placement updates"');
  expect(csv).toContain('"2","0","1","1","0"');
  expect(csv).not.toMatch(/recipient_email|recipient_phone|mobile_number/i);
  expect(csv).toContain('"matching_total","1"');
 });
 it("escapes an injected quoted comma and embedded newline within one CSV field",()=>{
  const raw='=HYPERLINK("https://evil.invalid","open")\nsecond';
  const csv=messagingHistoryCsv([makeRow(raw)],1);
  expect(csv).toContain('"\'=HYPERLINK(""https://evil.invalid"",""open"")\nsecond"');
  expect(csv).toMatch(/"export_rows","1","matching_total","1"\r\n$/);
 });
});
