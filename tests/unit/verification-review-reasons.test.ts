import {describe,it,expect} from "vitest";
import {verificationSendBackReason,VERIFICATION_SEND_BACK_REASONS} from "@/modules/verification/review-reasons";
describe("send back reason",()=>{it("supports a preset and an optional detail",()=>{
 expect(verificationSendBackReason(VERIFICATION_SEND_BACK_REASONS[0],"Year 2")).toBe("Marksheet is missing or unreadable: Year 2");
 expect(()=>verificationSendBackReason("No","")).toThrow("INVALID_VERIFICATION_REASON");
});});