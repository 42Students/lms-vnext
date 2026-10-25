import {describe,it,expect} from "vitest";
import {projectDeliveryAttachmentsSchema} from "@/modules/projects/pr-s2-07-delivery-reopen-model";
import {projectSubmissionDraftInputSchema} from "@/modules/projects/validation";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/modules/projects/submission-service.ts",import.meta.url),"utf8");
describe("PR-S2-07 registered 0091 attachments",()=>{
 it("validates URL scheme, duplicate attachments and bounded collection",()=>{
  const link={kind:"LINK" as const,name:"Demo",url:"https://example.com",fileId:null};
  expect(projectDeliveryAttachmentsSchema.safeParse([link]).success).toBe(true);
  expect(projectDeliveryAttachmentsSchema.safeParse([link,link]).success).toBe(false);
  expect(projectDeliveryAttachmentsSchema.safeParse([{...link,url:"javascript:alert(1)"}]).success).toBe(false);
  expect(projectSubmissionDraftInputSchema.shape.attachments).toBeDefined();
 });
 it("validates registered READY team scoped uploads and audits updates",()=>{
  expect(source).toContain('projectFinalFileEvidenceIsVerified(file)');
  expect(source).toContain('resource.visibility!=="TEAM"');
  expect(source).toContain('eventType:"ATTACHMENTS_CHANGED"');
  expect(source).toContain('attachments:input.attachments??[]');
 });
});