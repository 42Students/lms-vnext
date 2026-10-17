import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoCampaignHistoryTime,tpoCampaignHistoryStatus} from "@/modules/messaging/tpo-campaign-history-copy";
const src=(path:string)=>readFileSync(path,"utf8");
describe("TPO legacy Emails history copy",()=>{
 it("TPO-campaigns-public-10 renders HH:mm D MMM YYYY in IST and clear lifecycle labels",()=>{
  expect(tpoCampaignHistoryTime(new Date("2099-12-31T18:30:00Z"))).toBe("00:00 1 Jan 2100");
  expect(tpoCampaignHistoryStatus("SENDING")).toBe("Sending");
  expect(tpoCampaignHistoryStatus("SENT")).toBe("Sent");
  expect(tpoCampaignHistoryStatus("DRAFT")).toBe("Draft");
 });
 it("TPO-campaigns-public-10 retains exact Emails, sent/skipped/failed and failure Retry copy",()=>{
  const page=src("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  const error=src("src/app/(authenticated)/tpo/recruiters/campaigns/error.tsx");
  expect(page).toContain('title="Emails"');
  expect(page).toContain("No emails sent from Engage yet.");
  expect(page).toContain("To send one, select recruiters in the table and choose Act, then Send an email.");
  expect(page).toContain("{item.sent} sent");
  expect(page).toContain('item.skipped+" skipped"');
  expect(page).toContain('item.failed+" failed"');
  expect(page).toContain("tpoCampaignHistoryTime(new Date(item.created_at))");
  expect(error).toContain("Couldn't load emails");
  expect(error).toContain("Retry");
 });
});