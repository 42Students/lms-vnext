import {describe,it,expect} from "vitest";
import {collegeBulkReviewPayload} from "@/modules/verification/bulk-client-payload";
import {bulkVerificationInput} from "@/modules/verification/bulk-review-input";
describe("college bulk client payload",()=>{
 const a={learnerMembershipId:"00000000-0000-4000-8000-000000000123",section:"IDENTITY" as const,status:"SUBMITTED" as const,version:3};
 it("prepares only the allowed, confirmed, optimistic-versioned fields",()=>{
  const body=collegeBulkReviewPayload([a],"VERIFY");
  expect(bulkVerificationInput.parse(body)).toMatchObject({action:"VERIFY",confirm:true,items:[{expectedVersion:3}]});
  expect(JSON.stringify(body)).not.toContain("collegeId");
  expect(JSON.stringify(body)).not.toContain("status");
 });
 it("excludes decided rows before execution",()=>{
  expect(collegeBulkReviewPayload([{...a,status:"VERIFIED"}],"VERIFY").items).toHaveLength(0);
 });
});

describe("reasoned bulk send-back payload",()=>{it("requires the same sanitized shared reason for each selected item",()=>{
 const row={learnerMembershipId:"00000000-0000-4000-8000-000000000123",section:"EDUCATION" as const,status:"SUBMITTED" as const,version:1};
 const body=collegeBulkReviewPayload([row],"SEND_BACK","  Please resubmit marksheet  ");
 expect(body.reason).toBe("Please resubmit marksheet");
 expect(bulkVerificationInput.safeParse(body).success).toBe(true);
 expect(bulkVerificationInput.safeParse({...body,reason:" "}).success).toBe(false);
});});
