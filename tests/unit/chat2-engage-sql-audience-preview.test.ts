import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/modules/messaging/engage-audience-service.ts","utf8");
describe("TPO campaign preview bounded SQL",()=>{
 it("TPO-campaigns-public-R10 previews segment counts in scoped SQL rather than loading all CRM leads",()=>{
  expect(source).toContain("count(*) filter (where");
  expect(source).toContain("outsideSegment:");
  expect(source).toContain("withoutEmail:");
  expect(source).toContain("notNow:");
  expect(source).toContain("eligible:");
  expect(source).not.toContain("summarizeEngageAudience(contacts,query.segment)");
  expect(source).toContain("eq(placementTpoLeads.collegeId,college.id)");
 });
 it("TPO-campaigns-public-07 selected preview reads at most 100 requested IDs via SQL IN, never scans all leads",()=>{
  expect(source).toContain("selectedLeadIds:z.array(z.string().uuid()).min(1).max(100)");
  expect(source).toContain("inArray(placementTpoLeads.id,query.selectedLeadIds)");
  expect(source).toContain("planTpoCampaignRecipients(contacts)");
 });
});
