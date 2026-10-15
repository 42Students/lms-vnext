import {describe,it,expect} from "vitest";
import {verificationDecisionIntent} from "@/modules/verification/decision-intent";
const id="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
describe("verification notification intent",()=>{it("uses post-commit version for idempotency",()=>{
 const input={learnerMembershipId:id,section:"EDUCATION" as const,expectedVersion:4,action:"SEND_BACK" as const,reason:"Missing marksheet"};
 expect(verificationDecisionIntent(input,5)).toMatchObject({decision:"SENT_BACK",reason:"Missing marksheet",idempotencyKey:`profile-verification:${id}:EDUCATION:5`});
 expect(()=>verificationDecisionIntent(input,4)).toThrow("DECISION_NOT_COMMITTED");
});});