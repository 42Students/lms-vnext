import {expect,it} from "vitest";
import {isValidRecipient,decideDelivery,type DeliveryPolicy} from "@/modules/messaging/model";
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],
 suppressed:new Set(),sentToday:0,dailyCap:2,recentRecipientSends:0,recipientWindowCap:2};
it.each(["a..b@example.com",".alice@example.com","bob.@example.com","bob@example..com",
 "bob@-example.com","bob@example-.com","bob@example.com\u0000",
 "bob@example.com\nBCC:foo@bar.com","a".repeat(65)+"@example.com"])(
 "does not deliver malformed recipient %s",recipient=>{
 expect(isValidRecipient("EMAIL",recipient)).toBe(false);
 expect(decideDelivery({channel:"EMAIL",recipient,templateKey:"placement.notice",purpose:"NOTICE",variables:{}},policy))
 .toEqual({status:"SUPPRESSED",reason:"invalid-recipient"});
});
it("continues to accept ordinary email and E.164 recipients",()=>{
 expect(isValidRecipient("EMAIL","alice+jobs@example.co.in")).toBe(true);
 expect(isValidRecipient("SMS","+919876543210")).toBe(true);
});
