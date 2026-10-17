import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Recruiter leads immutable tenant audit trail",()=>{
 it("TPO-recruiters-R05 records lead create, edits, call transitions, Not now and Contacted as college-scoped events",()=>{
  const s=source("src/modules/placements/tpo-crm-service.ts");
  expect(s).toContain('eventType:"RECRUITER_LEADS_CREATED"');
  expect(s).toContain('eventType:"RECRUITER_LEADS_CONTACT_UPDATED"');
  expect(s.match(/eventType:"RECRUITER_LEADS_STAGE_SET"/g)?.length).toBeGreaterThanOrEqual(3);
  expect(s).toContain("organizationId:college.organizationId");
  expect(s).toContain("actorUserId:context.user.id");
  expect(s).toContain("subjectType:\"placement_tpo_lead\"");
  expect(s).toContain("metadata:{beforeStage:");
 });
 it("TPO-recruiters-R05 TPO-recruiters-17 records a created recruiter invite link without inventing delivery",()=>{
  const s=source("src/modules/placements/tpo-recruiter-invite-service.ts");
  expect(s).toContain('eventType:"RECRUITER_LEADS_INVITE_LINK_CREATED"');
  expect(s).toContain('metadata:{delivery:"NOT_SENT"');
  expect(s).toContain("tx.insert(activityEvents)");
  expect(s).not.toContain('eventType:"RECRUITER_LEADS_INVITED_BY_EMAIL"');
 });
 it("TPO-recruiters-R05 labels actual events in Audit Log using recognisable wording",()=>{
  expect(formatTpoAuditEventType("RECRUITER_LEADS_STAGE_SET")).toBe("Recruiter lead stage changed");
  expect(formatTpoAuditEventType("RECRUITER_LEADS_CONTACT_UPDATED")).toBe("Recruiter contact updated");
  expect(formatTpoAuditEventType("RECRUITER_LEADS_INVITE_LINK_CREATED")).toBe("Recruiter invite link created");
  expect(formatTpoAuditEventType("PLACEMENTS_RECRUITER_BULK_STAGE")).toBe("Bulk recruiter stages updated");
 });
});