import {describe,it,expect} from "vitest";
import {TPO_QUICK_REPLIES,recruiterMessageDraftKey} from "@/modules/placements/tpo-message-draft-model";
describe("TPO-inbox-team-02 reply drafts and quick replies",()=>{
 const a="c1a74a31-8de2-4e6f-9f64-b5d3e13c664c",b="a4b841e5-0836-4d0a-8868-00953959a1b2";
 it("isolates drafts by actor and thread",()=>{
  expect(recruiterMessageDraftKey(a,b)).not.toBe(recruiterMessageDraftKey(b,b));
  expect(()=>recruiterMessageDraftKey("spoof",b)).toThrow();
 });
 it("offers canned replies without merging sensitive content",()=>{
  expect(TPO_QUICK_REPLIES).toEqual(["Thanks, noted.", "Will confirm by end of day.",
    "Please share the updated list.", "Can we talk today?"]);
  expect(TPO_QUICK_REPLIES.every(s=>s.length<4000&&!s.includes("{"))).toBe(true);
 });
});
