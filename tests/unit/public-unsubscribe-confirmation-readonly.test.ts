import {it,expect} from "vitest";
import {issueUnsubscribeToken,unsubscribeConfirmation} from "@/modules/messaging/unsubscribe-model";
it("valid signed GET-preview never triggers opt out without a POST",()=>{
 const key="a".repeat(64),now=100000;
 const token=issueUnsubscribeToken({version:1,recipientKey:"f".repeat(64),expiresAt:now+10000},key);
 expect(unsubscribeConfirmation(token,key,now)).toEqual({canConfirm:true,willUnsubscribeOnView:false});
 expect(unsubscribeConfirmation(token,key,now+10001).canConfirm).toBe(false);
});
