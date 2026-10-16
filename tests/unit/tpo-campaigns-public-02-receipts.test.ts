import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-campaigns-public-02 preserved composer record and receipts",()=>{
 it("uses registered 0103 draft columns and avoids unsupported columns",()=>{
  const sql=readFileSync("drizzle/0103_tpo_campaign_drafts.sql","utf8");
  for(const column of ["subject","body","campaign_id","created_by_user_id"])expect(sql).toContain(column);
  expect(sql).not.toContain("sender_name");
  expect(sql).not.toContain("suppressed_counts");
  const service=readFileSync("src/modules/messaging/tpo-campaign-draft-service.ts","utf8");
  expect(service).not.toContain("created_by_user_id,sender_name,suppressed_counts");
 });
 it("counts actual recipient statuses; does not equate provider acceptance to delivery",()=>{
  const svc=readFileSync("src/modules/messaging/tpo-campaign-draft-service.ts","utf8");
  const page=readFileSync("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx","utf8");
  expect(svc).toContain("r.status='SENT'");
  expect(svc).toContain("r.status='FAILED'");
  expect(page).toContain("Provider acceptance is not proof of delivery");
 });
});
