import {it,expect} from "vitest";
import {issueUnsubscribeToken,unsubscribeConfirmation} from "@/modules/messaging/unsubscribe-model";
it("viewing campaign link never calls a suppression mutation",()=>{
 const key="a-secret-key-of-at-least-thirty-two-characters";
 const token=issueUnsubscribeToken({version:1,recipientKey:"a".repeat(64),expiresAt:Date.now()+60_000},key);
 expect(unsubscribeConfirmation(token,key,Date.now()).willUnsubscribeOnView).toBe(false);
});
