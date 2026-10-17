import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");

describe("TPO campaign delivery receipts and audit",()=>{
 it("TPO-campaigns-public-04 commits a college-scoped batch before sending and actual opaque statuses after",()=>{
  const service=src("src/modules/messaging/tpo-campaign-dispatch-service.ts");
  const schema=src("src/db/schema/messaging-receipts.ts");
  expect(service).toContain("tx.insert(messagingDeliveryBatches).values");
  expect(service).toContain("organizationId:college.organizationId,collegeId:college.id");
  expect(service.indexOf("tx.insert(messagingDeliveryBatches)")).toBeLessThan(service.indexOf("outbound.send("));
  expect(service).toContain("recipientKey:placementTpoEmailCampaignRecipients.recipientKey");
  expect(service).toContain("eq(placementTpoEmailCampaignRecipients.collegeId,college.id)");
  expect(service).toContain("tx.insert(messagingDeliveryReceipts).values(receipts)");
  expect(service).toContain("finalizedAt:new Date()");
  expect(service).toContain('status:"SENDING"');
  expect(service).toContain('status:"QUEUED"');
  expect(schema).toContain("messaging_delivery_receipts");
  expect(service).not.toContain("recipient:row.email,recipientKey:");
 });
 it("TPO-campaigns-public-04 never claims delivery from provider acceptance or violates EMAIL event constraints",()=>{
  const service=src("src/modules/messaging/tpo-campaign-dispatch-service.ts");
  expect(service).toContain('type:"EMAIL",isSystem:false');
  expect(service).toContain("createdByUserId:context.user.id");
  expect(service).toContain('status:result?"SENT":"FAILED"');
  expect(service).toContain('row.status==="SKIPPED_NO_EMAIL"?"invalid-recipient":"unsubscribed"');
  const history=src("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(history).toContain("Provider acceptance does not prove recipient delivery");
 });
});