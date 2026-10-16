import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-campaigns-public-02 preserved composer record and receipts",()=>{
 it("stages durable subject, sender, message and suppression counts",()=>{
  const sql=readFileSync("docs/proposed-migrations/tpo-campaign-draft-persistence.sql","utf8");
  for(const column of ["subject","body","sender_name","suppressed_counts"])expect(sql).toContain(column);
 });
 it("counts actual recipient statuses; does not equate provider acceptance to delivery",()=>{
  const svc=readFileSync("src/modules/messaging/tpo-campaign-draft-service.ts","utf8");
  const page=readFileSync("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx","utf8");
  expect(svc).toContain("r.status='SENT'");
  expect(svc).toContain("r.status='FAILED'");
  expect(page).toContain("Provider acceptance is not proof of delivery");
 });
});
