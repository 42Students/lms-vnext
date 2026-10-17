import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO campaigns and company page remaining audited increments",()=>{
 it("TPO-campaigns-public-04 records sent campaigns through real delivery batches and recipient receipts, without claiming unsent invites",()=>{
  const service=src("src/modules/messaging/tpo-campaign-dispatch-service.ts");
  expect(service).toContain("messagingDeliveryBatches");
  expect(service).toContain("messagingDeliveryReceipts");
  expect(service).toContain("tx.insert(messagingDeliveryBatches)");
  expect(service).toContain("tx.insert(messagingDeliveryReceipts)");
  expect(service).toContain("eq(messagingDeliveryBatches.collegeId,college.id)");
 });
 it("TPO-campaigns-public-23 records a verified recruiter join and scoped TPO bell; welcome email and opens remain pending",()=>{
  const join=src("src/modules/placements/public-join/join-service.ts");
  expect(join).toContain('"PLACEMENTS_RECRUITER_PUBLIC_JOIN"');
  expect(join).toContain("publicRecruiterJoinedNotification");
  expect(join).toContain("tx.insert(inAppNotifications)");
  expect(join).toContain("placementPublicJoinLinks.joinsCount");
 });
 it("TPO-companies-20 routes the default list to legacy Engage Companies while preserving explicit named memory and scoped directory URLs",()=>{
  const page=src("src/app/(authenticated)/tpo/companies/page.tsx");
  expect(page).toContain('redirect("/tpo/recruiters?view=companies")');
  expect(page).toContain('first(raw.directory)!=="1"');
  expect(page).toContain("TpoCompanyMemoryWorkspace");
  expect(page).toContain("tpoCompaniesQuerySchema.safeParse");
 });
});