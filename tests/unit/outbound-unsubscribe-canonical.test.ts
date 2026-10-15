import {expect,it} from "vitest";
import {issueUnsubscribeToken,verifyUnsubscribeToken,unsubscribeConfirmation} from "@/modules/messaging/unsubscribe-model";
const key="a-secret-key-of-at-least-thirty-two-characters";
it("rejects alternative padded or malformed token encodings without mutating opt-out state",()=>{
 const raw=issueUnsubscribeToken({version:1,recipientKey:"a".repeat(64),expiresAt:10000},key);
 expect(verifyUnsubscribeToken(raw,key,9999)).not.toBeNull();
 expect(verifyUnsubscribeToken(raw+"=",key,9999)).toBeNull();
 expect(verifyUnsubscribeToken(raw.replace("."," ."),key,9999)).toBeNull();
 expect(unsubscribeConfirmation(raw,key,9999).willUnsubscribeOnView).toBe(false);
});
