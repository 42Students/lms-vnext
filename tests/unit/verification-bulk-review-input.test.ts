import {describe,it,expect} from "vitest";
import {bulkVerificationInput,MAX_STAFF_BULK_REVIEWS} from "@/modules/verification/bulk-review-input";
const item={learnerMembershipId:"00000000-0000-4000-8000-000000000123",section:"EDUCATION",expectedVersion:1};
describe("staff bulk verification input",()=>{
 it("requires explicit confirmation and rejects a forged tenant",()=>{
  expect(bulkVerificationInput.safeParse({confirm:true,action:"VERIFY",items:[item]}).success).toBe(true);
  expect(bulkVerificationInput.safeParse({confirm:false,action:"VERIFY",items:[item]}).success).toBe(false);
  expect(bulkVerificationInput.safeParse({confirm:true,action:"VERIFY",collegeId:"foreign",items:[item]}).success).toBe(false);
 });
 it("rejects duplicates, unbounded batches and missing send-back reason",()=>{
  expect(bulkVerificationInput.safeParse({confirm:true,action:"VERIFY",items:[item,item]}).success).toBe(false);
  expect(bulkVerificationInput.safeParse({confirm:true,action:"VERIFY",items:Array(MAX_STAFF_BULK_REVIEWS+1).fill(item)}).success).toBe(false);
  expect(bulkVerificationInput.safeParse({confirm:true,action:"SEND_BACK",items:[item]}).success).toBe(false);
  expect(bulkVerificationInput.safeParse({confirm:true,action:"SEND_BACK",reason:"Incomplete marksheet",items:[item]}).success).toBe(true);
 });
});
