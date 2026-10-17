import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoVerificationSectionReasons} from "@/modules/verification/review-reasons";
const d=()=>readFileSync(new URL("../../src/components/verification/VerificationReviewDrawer.tsx",import.meta.url),"utf8");
describe("chat-12 Verification legacy send-back reason selector",()=>{
 it("TPO-requests-verification-27 offers the three Education reasons used in legacy LMS",()=>{
  expect(tpoVerificationSectionReasons("EDUCATION")).toEqual([
   "The marksheet is unclear or cropped","The marks do not match the marksheet","A marksheet is missing",
  ]);
 });
 it("TPO-requests-verification-27 offers the three Identity reasons used in legacy LMS",()=>{
  expect(tpoVerificationSectionReasons("IDENTITY")).toEqual([
   "The document does not match the number","Wrong document uploaded","The document is unclear or cropped",
  ]);
 });
 it("TPO-requests-verification-27 permits a custom-only reason but prevents an empty send-back",()=>{
  expect(d()).toContain('<option value="">Or write what needs to change</option>');
  expect(d()).toContain('onChange={e=>setReason(e.target.value)}');
  expect(d()).toContain('setError("Write what needs to change before sending this back.")');
  expect(d()).toContain("The student sees your reason and fixes it on their profile.");
  expect(d()).toContain('?"Send "+(row.section==="EDUCATION"?"Education":"Identity")+" back"');
  expect(d()).toContain('[reason,additional.trim()].filter(Boolean).join(": ").trim().length<3');
 });
 it("GR-33 validates a free-text send-back reason before calling the server",()=>{
  expect(d()).toContain('trim().length<3');
 });
});
