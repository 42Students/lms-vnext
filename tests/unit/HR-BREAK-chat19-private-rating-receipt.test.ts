import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 parseRecruiterPrivateReviewReceipt,isConfirmedRecruiterPrivateReview,
} from "@/modules/placements/recruiter-private-rating-receipt-model";

const savedAt="2026-10-18T18:00:00.000Z";
const baseline={rating:4,note:"Strong technical skills",updatedAt:savedAt};

describe("HR-BREAK-PRIVATE-RECEIPT-52: employer rating success must be a persisted receipt",()=>{
 it("accepts an authorized GET projection with nullable rating and initial version",()=>{
  expect(parseRecruiterPrivateReviewReceipt(baseline)).toEqual(baseline);
  expect(parseRecruiterPrivateReviewReceipt({rating:null,note:"",updatedAt:null}))
   .toEqual({rating:null,note:"",updatedAt:null});
 });
 it.each([
  null,{},[],{error:"FORBIDDEN"},
  {rating:0,note:"x",updatedAt:savedAt},
  {rating:6,note:"x",updatedAt:savedAt},
  {rating:"4",note:"x",updatedAt:savedAt},
  {rating:2.4,note:"x",updatedAt:savedAt},
  {rating:4,note:null,updatedAt:savedAt},
  {rating:4,note:"x".repeat(1001),updatedAt:savedAt},
  {rating:4,note:"x",updatedAt:"not a date"},
  {rating:4,note:"x",updatedAt:"2026-02-30T10:00:00.000Z"},
  {rating:4,note:"x",updatedAt:undefined},
 ])("rejects malformed, expired-session-shaped or tampered GET/PATCH payload %j",(payload)=>{
  expect(parseRecruiterPrivateReviewReceipt(payload)).toBeNull();
 });
 it("rejects successful HTTP payloads without persisted version or exact submitted edit",()=>{
  const requested={rating:5,note:"Updated"};
  expect(isConfirmedRecruiterPrivateReview(
   parseRecruiterPrivateReviewReceipt({rating:5,note:"Updated",updatedAt:null}),requested))
   .toBe(false);
  expect(isConfirmedRecruiterPrivateReview(
   parseRecruiterPrivateReviewReceipt(baseline),requested)).toBe(false);
  expect(isConfirmedRecruiterPrivateReview(
   parseRecruiterPrivateReviewReceipt({...requested,updatedAt:savedAt}),requested))
   .toBe(true);
  expect(isConfirmedRecruiterPrivateReview(
   parseRecruiterPrivateReviewReceipt({rating:null,note:"",updatedAt:savedAt}),
   {rating:null,note:""})).toBe(true);
 });
 it("guards both reads and saves against redirect fallback and does not clear unsent edits on false success",()=>{
  const source=readFileSync("src/components/hr/recruiter-private-rating-editor.tsx","utf8");
  expect(source).toContain('redirect:"error"');
  expect(source).toContain("if(!response.ok||response.redirected)");
  expect(source).toContain("if(!response||response.redirected)");
  expect(source).toContain("parseRecruiterPrivateReviewReceipt(payload)");
  expect(source).toContain("isConfirmedRecruiterPrivateReview(body,requested)");
  expect(source.indexOf("isConfirmedRecruiterPrivateReview(body,requested)"))
   .toBeLessThan(source.indexOf("setSaved(body);setRating(body.rating);setNote(body.note);"));
  expect(source).toContain("expectedUpdatedAt:saved.updatedAt");
  expect(source).toContain("Your changes are still here; try again.");
 });
});
