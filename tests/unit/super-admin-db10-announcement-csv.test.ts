import {describe,it,expect} from "vitest";
import {announcementHistoryCsv} from "@/modules/announcements/admin-csv-model";
const sample={id:"123e4567-e89b-42d3-a456-426614174000",receiverType:"COLLEGE",title:"=HYPERLINK(\"bad\")",
 createdAt:new Date("2026-10-15T10:00:00Z"),scheduledAt:null,expiresAt:null,deletedAt:null,isPinned:false,version:0};
describe("super admin announcements filtered CSV",()=>{
 it("neutralizes spreadsheet formulas and quotes",()=>{
  const csv=announcementHistoryCsv([sample],Date.parse("2026-10-15T11:00:00Z"));
  expect(csv).toContain("'=HYPERLINK(\"\"bad\"\")");expect(csv).toContain("LIVE");expect(csv).toContain("Notice ID");
 });
 it("caps the export page at 50",()=>{
  const csv=announcementHistoryCsv(Array.from({length:51},()=>sample),Date.now());
  expect(csv.trim().split("\r\n")).toHaveLength(51);
 });
 it("omits user contact, sender and message fields",()=>{
  const csv=announcementHistoryCsv([sample],Date.now());
  expect(csv).not.toContain("Sender email");expect(csv).not.toContain("Message body");
 });
});
