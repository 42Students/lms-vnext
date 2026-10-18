import {describe,expect,it} from "vitest";
import {safeRecruiterEmailMergeText,safeRecruiterDigestMessages} from "@/modules/placements/recruiter-message-email-model";
import {conversationSnippet} from "@/modules/placements/hr-conversation-snippet-model";
import {safeInboundPreview} from "@/modules/inbound-mail/message-model";
import {safeMailDrawerText} from "@/modules/inbound-mail/drawer-model";

describe("chat-16 recruiter email and inbound mail Unicode-safe truncation",()=>{
 it("HR-EMAIL-DIGEST-UNICODE-01 never emits partial emoji or HTML entity at the provider limit",()=>{
  expect(safeRecruiterEmailMergeText("abc😀remaining",4)).toBe("abc");
  expect(safeRecruiterEmailMergeText("abc😀remaining",5)).toBe("abc😀");
  expect(safeRecruiterEmailMergeText("<a>",3)).toBe("");
  expect(safeRecruiterEmailMergeText("<a>",2)).toBe("");
  expect(safeRecruiterEmailMergeText("a\nb")).toBe("a b");
  expect(safeRecruiterDigestMessages([{body:"first"},{body:"second"},{body:"abc😀remaining"}]))
   .toEqual(["first","second","abc😀remaining"]);
 });
 it("HR-CONVERSATIONS-UNICODE-02 clips message previews without leaving unmatched UTF-16 surrogates",()=>{
  expect(conversationSnippet("abc😀remaining",5)).toBe("abc…");
  expect(conversationSnippet("abc😀remaining",6)).toBe("abc😀…");
  expect(conversationSnippet("abc😀remaining",20)).toBe("abc😀remaining");
  expect(conversationSnippet("anything",0)).toBe("");
  expect(conversationSnippet("a".repeat(510),Number.NaN).length).toBeLessThanOrEqual(120);
 });
 it("INBOUND-MAIL-UNICODE-03 keeps status list excerpts valid and bounds hostile controls",()=>{
  expect(safeInboundPreview("abc😀remaining",4)).toBe("abc");
  expect(safeInboundPreview("abc😀remaining",5)).toBe("abc😀");
  expect(safeInboundPreview("a\r\nb\t\u0000c",20)).toBe("a b c");
  expect(safeInboundPreview("anything",-100)).toBe("");
  expect(safeInboundPreview("a".repeat(2000),2000)).toHaveLength(1000);
 });
 it("INBOUND-MAIL-UNICODE-04 preserves valid UTF-16 in a large single-message drawer",()=>{
  const large="a".repeat(99_999)+"😀"+"rest";
  expect(safeMailDrawerText(large)).toBe("a".repeat(99_999));
  expect(safeMailDrawerText("small\u0000note")).toBe("smallnote");
  expect(safeMailDrawerText("😀")).toBe("😀");
 });
});