import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Engage campaign history legacy routes and copy",()=>{
 it("TPO-campaigns-public-09 returns notFound for a non-UUID batch before database parsing",()=>{
  const detail=src("src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx");
  expect(detail).toContain("if(!z.string().uuid().safeParse(batchId).success)notFound()");
  expect(detail.indexOf("safeParse(batchId)")).toBeLessThan(detail.indexOf("getTpoMessagingBatch(context,batchId)"));
  const scoped=src("src/modules/messaging/receipt-detail-service.ts");
  expect(scoped).toContain("eq(messagingDeliveryBatches.collegeId,college.id)");
 });
 it("TPO-campaigns-public-10 uses Emails tab and truthful empty history message",()=>{
  const listing=src("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(listing).toContain('title="Emails"');
  expect(listing).toContain("No emails sent from Engage yet.");
  expect(listing).toContain("<dt>Sent</dt>");
  expect(listing).toContain("<dt>Skipped</dt>");
 });
});
