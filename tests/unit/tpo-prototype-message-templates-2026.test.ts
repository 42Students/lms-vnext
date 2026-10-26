import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {TPO_MESSAGE_TEMPLATE_LIBRARY,searchTpoMessageTemplates}
 from "@/modules/placements/tpo-message-template-library";
import {shouldSendTpoRecruiterReplyKey} from "@/modules/placements/tpo-message-draft-model";

describe("2026 TPO Companies / Messages prototype template picker",()=>{
 it("searches across names, categories and suggestion text deterministically",()=>{
  expect(TPO_MESSAGE_TEMPLATE_LIBRARY.length).toBeGreaterThanOrEqual(20);
  expect(searchTpoMessageTemplates("shortlist").map(item=>item.id)).toContain("share-shortlist");
  expect(searchTpoMessageTemplates("panel details").map(item=>item.id)).toContain("panel-details");
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
 it("matches Enter-to-send, Shift+Enter newline and IME safety in the original screenshot",()=>{
  const key=(key:string,shiftKey=false,altKey=false,isComposing=false)=>
   shouldSendTpoRecruiterReplyKey({key,shiftKey,altKey,isComposing});
  expect(key("Enter")).toBe(true);
  expect(key("Enter",true)).toBe(false);
  expect(key("Enter",false,true)).toBe(false);
  expect(key("Enter",false,false,true)).toBe(false);
  expect(key("a")).toBe(false);
  const file=readFileSync("src/components/tpo/tpo-recruiter-message-reply.tsx","utf8");
  expect(file).toContain("shouldSendTpoRecruiterReplyKey({key:e.key");
  expect(file).toContain("Enter to send · Shift+Enter for a new line");
  expect(file).toContain('role="group" aria-label="Quick replies"');
  expect(file).toContain("matchedTemplates.length} of {TPO_MESSAGE_TEMPLATE_LIBRARY.length}");
  expect(file).toContain('if(body.trim()&&!busy&&!accessEnded)void post("messages")');
 });

});
