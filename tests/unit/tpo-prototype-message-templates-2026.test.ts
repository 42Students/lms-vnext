import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {TPO_MESSAGE_TEMPLATE_LIBRARY,searchTpoMessageTemplates}
 from "@/modules/placements/tpo-message-template-library";

describe("2026 TPO Companies / Messages prototype template picker",()=>{
 it("searches across names, categories and suggestion text deterministically",()=>{
  expect(TPO_MESSAGE_TEMPLATE_LIBRARY.length).toBeGreaterThanOrEqual(8);
  expect(searchTpoMessageTemplates("WELCOME").map(item=>item.id)).toContain("welcome");
  expect(searchTpoMessageTemplates("planning a drive").map(item=>item.id)).toContain("slots");
  expect(searchTpoMessageTemplates("no-such-template")).toEqual([]);
  expect(searchTpoMessageTemplates("")).toHaveLength(TPO_MESSAGE_TEMPLATE_LIBRARY.length);
 });
 it("never substitutes fictional eligibility totals or recruiter details into messages",()=>{
  for(const item of TPO_MESSAGE_TEMPLATE_LIBRARY){
   expect(item.text).not.toMatch(/\b(?:96 students|5 placed|\d+ eligible)\b/i);
   expect(item.text.trim().length).toBeGreaterThan(15);
  }
  expect(TPO_MESSAGE_TEMPLATE_LIBRARY.find(item=>item.id==="eligible-count")?.text)
   .toContain("verify");
 });
 it("preserves the scoped existing message endpoint, draft and read receipts",()=>{
  const file=readFileSync("src/components/tpo/tpo-recruiter-message-reply.tsx","utf8");
  expect(file).toContain('title="Message templates"');
  expect(file).toContain('placeholder="Search message templates"');
  expect(file).toContain('aria-label="Template preview"');
  expect(file).toContain('matchedTemplates.length===0');
  expect(file).toContain("const template=matchedTemplates.find");
  expect(file).toContain('onClick={()=>{if(!template)return;addQuickReply(template.text);setTemplateOpen(false);}}');
  expect(file).toContain("draftKey=recruiterMessageDraftKey(actorUserId,threadId)");
  expect(file).toContain('method:"POST"');
  expect(file).toContain('body:body.trim()');
  expect(file).toContain('accessEnded');
  expect(file).toContain("Message must be 4000 characters or fewer.");
 });
});
