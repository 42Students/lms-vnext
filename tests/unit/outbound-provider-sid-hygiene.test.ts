import {describe,it,expect} from "vitest";
import {isExotelAcceptedResponse} from "@/modules/messaging/provider-acceptance-model";
describe("SMS provider opaque receipt hygiene",()=>{
 it.each([" ","foo@example.com","SM123\nBcc:example","SM123 456","x".repeat(129)])("rejects unsafe provider SID",sid=>{
  expect(isExotelAcceptedResponse({SMSMessage:{Sid:sid,Status:"queued"}})).toBe(false);
 });
 it("accepts a bounded opaque receipt with an affirmative state",()=>{
  expect(isExotelAcceptedResponse({SMSMessage:{Sid:"SM-abc_123",Status:"submitted"}})).toBe(true);
 });
 it("does not promote unknown states to accepted",()=>{
  expect(isExotelAcceptedResponse({SMSMessage:{Sid:"SM123",Status:"unknown"}})).toBe(false);
 });
});
