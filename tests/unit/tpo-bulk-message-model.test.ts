import {describe,it,expect} from "vitest";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
import {tpoBulkApplicationReady} from "@/modules/placements/tpo-bulk-decision-model";
import {readFileSync} from "node:fs";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO-drive-workspace-25 applicant messages",()=>{
 it("requires signed preview contract and limits text",()=>{
  expect(tpoBulkPreviewRequestSchema.safeParse({
   target:"APPLICATIONS",jobId:id,action:"SEND_MESSAGE",note:"Interview update",ids:[id],
  }).success).toBe(true);
  expect(tpoBulkPreviewRequestSchema.safeParse({
   target:"APPLICATIONS",jobId:id,action:"SEND_MESSAGE",note:"too short",ids:[id],
  }).success).toBe(false);
 });
 it("does not send to withdrawn applications or unpublished jobs",()=>{
  expect(tpoBulkApplicationReady("SEND_MESSAGE","PUBLISHED","SUBMITTED",null,null)).toBe(true);
  expect(tpoBulkApplicationReady("SEND_MESSAGE","DRAFT","SUBMITTED",null,null)).toBe(false);
  expect(tpoBulkApplicationReady("SEND_MESSAGE","PUBLISHED","WITHDRAWN",null,null)).toBe(false);
 });
 it("writes event and notification together, scoping the recipient",()=>{
  const s=readFileSync(new URL("../../src/modules/placements/tpo-bulk-applicant-message-service.ts",import.meta.url),"utf8");
  expect(s).toContain("return getDb().transaction(async tx=>");
  expect(s).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(s).toContain("eq(membershipRoles.role,\"LEARNER\")");
  expect(s).toContain("tx.insert(inAppNotifications)");
  expect(s).toContain("input.expectedVersion");
 });
});
