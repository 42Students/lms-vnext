import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const src=(path:string)=>readFileSync(path,"utf8");

describe("TPO campaign receipt detail protection",()=>{
 it("TPO-campaigns-public-12 only reads names and delivery status inside the current college",()=>{
  const service=src("src/modules/messaging/tpo-campaign-draft-service.ts");
  const detail=service.slice(service.indexOf("export async function listTpoCampaignRecipientStatuses"));
  expect(detail).toContain('await scope(context)');
  expect(detail).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(detail).toContain("eq(placementTpoEmailCampaigns.collegeId,college.id)");
  expect(detail).toContain("eq(placementTpoLeads.collegeId,placementTpoEmailCampaignRecipients.collegeId)");
  expect(detail).toContain("eq(placementTpoEmailCampaignRecipients.collegeId,college.id)");
  expect(detail).toContain("name:placementTpoLeads.name");
  expect(detail).toContain("status:placementTpoEmailCampaignRecipients.status");
  expect(detail).toContain(".limit(501)");
  expect(detail).not.toContain("emailNorm");
  expect(detail).not.toContain("recipientKey:");
 });
 it("TPO-campaigns-public-12 never mistakes provider acceptance for delivery or exposes emails",()=>{
  const page=src("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx");
  expect(page).toContain('aria-label="Campaign recipient statuses"');
  expect(page).toContain("listTpoCampaignRecipientStatuses(context,campaignId)");
  expect(page).toContain("Provider accepted");
  expect(page).toContain("not that the recruiter read it");
  expect(page).toContain("Skipped · opted out");
  expect(page).toContain("row.leadId");
  expect(page).not.toContain("row.email");
  expect(page).not.toContain("row.recipientKey");
 });
});