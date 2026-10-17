import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const decision=()=>src("src/components/placements/tpo-request-decision-control.tsx");
const review=()=>src("src/components/verification/VerificationReviewDrawer.tsx");
describe("chat-12 round3 TPO Requests and Verification failure safety",()=>{
 it("TPO-requests-verification-02 uses guarded decision posting with friendly errors",()=>{
  expect(decision()).toContain("await apiFetch(");
  expect(decision()).toContain("FriendlyFetchError");
  expect(decision()).not.toContain("response.json()");
 });
 it("TPO-requests-verification-03 preserves a rejection reason if the request fails",()=>{
  expect(decision()).toContain("decisionNote.length>=3");
  expect(decision()).toContain("e instanceof Error?e.message");
 });
 it("TPO-requests-verification-R01 keeps the placed-learner guidance for accepted offers",()=>{
  expect(decision()).toContain('e.code==="PLACEMENT_REQUEST_EFFECT_INVALID"');
  expect(decision()).toContain("This student is placed: reverse the acceptance on the Offers tab first, then approve.");
 });
 it("TPO-requests-verification-25 loads review details through apiFetch",()=>{
  expect(review()).toContain("apiFetch<Detail>(url");
 });
 it("TPO-requests-verification-28 makes verification errors friendly",()=>{
  expect(review()).toContain("await apiFetch(");
  expect(review()).not.toContain("payload.error");
 });
 it("TPO-requests-verification-29 does not parse raw HTML as private review evidence",()=>{
  expect(review()).toContain('apiFetch<Detail>(url,{cache:"no-store"})');
 });
 it("GR-04 and GR-32 preserve pending fields and turn conflicts into safe retry",()=>{
  expect(review()).toContain("e instanceof FriendlyFetchError&&e.status===409");
  expect(review()).toContain("Refresh the details and re-apply your decision.");
  expect(decision()).toContain("setError(e instanceof FriendlyFetchError");
 });
});
