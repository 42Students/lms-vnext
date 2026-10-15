import {describe,it,expect} from "vitest";
import {parseCollegeBulkReviewReceipt} from "@/modules/verification/bulk-response-validation";
const member="11111111-1111-4111-8111-111111111111";
const selected=[{learnerMembershipId:member,section:"EDUCATION"}];
const outcome={learnerMembershipId:member,section:"EDUCATION",result:"VERIFIED"};
const valid={summary:{attempted:1,succeeded:1,failed:0},outcomes:[outcome]};
describe("bulk review receipt contract",()=>{
 it("accepts an exact stored-result receipt",()=>{
  expect(parseCollegeBulkReviewReceipt(valid,selected).summary.succeeded).toBe(1);
 });
 it("rejects a forged candidate, duplicate, or aggregate mismatch",()=>{
  expect(()=>parseCollegeBulkReviewReceipt({...valid,outcomes:[{...outcome,learnerMembershipId:"22222222-2222-4222-8222-222222222222"}]},selected)).toThrow();
  expect(()=>parseCollegeBulkReviewReceipt({...valid,outcomes:[outcome,outcome]},selected)).toThrow();
  expect(()=>parseCollegeBulkReviewReceipt({...valid,summary:{attempted:1,succeeded:0,failed:1}},selected)).toThrow();
 });
 it("validates only submitted eligible candidates when local preview skipped another row",()=>{
  const extra={learnerMembershipId:"22222222-2222-4222-8222-222222222222",section:"IDENTITY"};
  const submitted=[selected[0]];
  expect(parseCollegeBulkReviewReceipt(valid,submitted).outcomes).toHaveLength(1);
  expect(()=>parseCollegeBulkReviewReceipt(valid,[...submitted,extra])).toThrow();
 });
 it("rejects unknown result codes and raw private fields",()=>{
  expect(()=>parseCollegeBulkReviewReceipt({...valid,outcomes:[{...outcome,result:"UNKNOWN"}]},selected)).toThrow();
  expect(()=>parseCollegeBulkReviewReceipt({...valid,outcomes:[{...outcome,privateNote:"must not echo"}]},selected)).toThrow();
 });
});
