import { describe,expect,it } from "vitest";
import { canSendPublicEnquiryCode,publicEnquirySendSchema,enquiryMac,enquiryMacMatches } from "@/modules/placements/public-enquiry/otp-model";
describe("TPO-campaigns-public-31 verified enquiry sender",()=>{
 const input={email:"talent@company.example"};
 it("rejects personal addresses and forged college IDs",()=>{
  expect(publicEnquirySendSchema.safeParse(input).success).toBe(true);
  expect(publicEnquirySendSchema.safeParse({email:"anyone@gmail.com"}).success).toBe(false);
  expect(publicEnquirySendSchema.safeParse({...input,collegeId:"forged"}).success).toBe(false);
 });
 it("enforces email, college and network rate limits",()=>{
  expect(canSendPublicEnquiryCode({email:4,college:299,ip:19})).toBe(true);
  expect(canSendPublicEnquiryCode({email:5,college:0,ip:0})).toBe(false);
  expect(canSendPublicEnquiryCode({email:0,college:300,ip:0})).toBe(false);
  expect(canSendPublicEnquiryCode({email:0,college:0,ip:20})).toBe(false);
 });
 it("hashes and compares codes",()=>{
  const id="4eacda30-a7fb-4acb-aa87-3ce176373205",secret="test-secret-longer-than-32-characters";
  const digest=enquiryMac(id,input.email,"001234",secret);
  expect(digest).toMatch(/^[a-f0-9]{64}$/);
  expect(enquiryMacMatches(digest,id,input.email,"001234",secret)).toBe(true);
  expect(enquiryMacMatches(digest,id,input.email,"001235",secret)).toBe(false);
 });
});
