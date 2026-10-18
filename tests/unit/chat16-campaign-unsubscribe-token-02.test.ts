import {describe,expect,it} from "vitest";
import {issueUnsubscribeToken,verifyUnsubscribeToken,unsubscribeConfirmation}
 from "@/modules/messaging/unsubscribe-model";
const key="K".repeat(64);
const claim={version:1 as const,recipientKey:"a".repeat(64),expiresAt:4102444800000};
describe("chat-16 public unsubscribe GET never mutates",()=>{
 it("campaign-opt-out-01 accepts only valid signed, unexpired token claims",()=>{
  const token=issueUnsubscribeToken(claim,key);
  expect(verifyUnsubscribeToken(token,key,Date.parse("2099-01-01"))).toEqual(claim);
  expect(verifyUnsubscribeToken(token,key,claim.expiresAt)).toBeNull();
  expect(verifyUnsubscribeToken(token+"=",key,Date.parse("2099-01-01"))).toBeNull();
  expect(verifyUnsubscribeToken(token,"wrong".repeat(9),Date.parse("2099-01-01"))).toBeNull();
  expect(()=>issueUnsubscribeToken(claim,"short")).toThrow();
 });
 it("campaign-opt-out-02 confirmation reads status only; POST must perform mutation",()=>{
  const token=issueUnsubscribeToken(claim,key);
  expect(unsubscribeConfirmation(token,key,Date.parse("2099-01-01"))).toEqual({canConfirm:true,willUnsubscribeOnView:false});
  expect(unsubscribeConfirmation(token,key,claim.expiresAt)).toEqual({canConfirm:false,willUnsubscribeOnView:false});
 });
});
