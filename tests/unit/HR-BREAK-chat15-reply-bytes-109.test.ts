import {describe,expect,it} from "vitest";
import {hrRecruiterReplySchema} from "@/modules/placements/hr-conversation-reply-model";
const threadId="123e4567-e89b-42d3-a456-426614174001";
describe("HR-MESSAGING-109 recruiter text persistence safety",()=>{
 it("refuses NUL and unprintable bytes that the PostgreSQL text type cannot represent",()=>{
  for(const body of ["Hello\u0000World","Hello\u0001World","Hello\u001fWorld","Hello\u007fWorld"]){
   expect(hrRecruiterReplySchema.safeParse({threadId,body}).success).toBe(false);
  }
 });
 it("supports genuine multiline recruiter-to-placement-cell conversations",()=>{
  expect(hrRecruiterReplySchema.parse({
   threadId,body:"Dear team,\nPlease check round two.\nThanks",
  }).body).toContain("\n");
  expect(hrRecruiterReplySchema.parse({threadId,body:"  Confirmed \r\n  "}).body)
   .toBe("Confirmed");
 });
 it("prevents empty or oversized messages and invented identity override fields",()=>{
  for(const body of ["","    ","x".repeat(4001)]){
   expect(hrRecruiterReplySchema.safeParse({threadId,body}).success).toBe(false);
  }
  expect(hrRecruiterReplySchema.safeParse({
   threadId,body:"Please schedule",recruiterUserId:"someone-else",
  }).success).toBe(false);
 });
});