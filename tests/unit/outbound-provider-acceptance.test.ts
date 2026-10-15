import {expect,it} from "vitest";
import {isExotelAcceptedResponse} from "@/modules/messaging/provider-acceptance-model";
it("never treats transport HTTP 2xx or an arbitrary nonfailed status as accepted delivery",()=>{
 expect(isExotelAcceptedResponse({SMSMessage:{Sid:"abc",Status:"queued"}})).toBe(true);
 expect(isExotelAcceptedResponse({SMSMessage:{Sid:"abc",Status:"FAILED"}})).toBe(false);
 expect(isExotelAcceptedResponse({SMSMessage:{Sid:"abc",Status:"rejected"}})).toBe(false);
 expect(isExotelAcceptedResponse({SMSMessage:{Sid:"",Status:"sent"}})).toBe(false);
 expect(isExotelAcceptedResponse({SMSMessage:{Status:"sent"}})).toBe(false);
});
