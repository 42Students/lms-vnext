import {describe,it,expect} from "vitest";
import {recruiterMailBridgeSignature,verifyRecruiterMailBridgeWithRotation}
 from "@/modules/placements/recruiter-message-email-model";
const current="c".repeat(40),old="o".repeat(40),body='{"event":"recruiter_reply"}';
const now=new Date("2026-10-22T12:00:00.000Z");
describe("authenticated inbound recruiter gateway rotation",()=>{
 it("accepts only signed payloads with the current secret",()=>{
  const signature=recruiterMailBridgeSignature(current,body);
  expect(verifyRecruiterMailBridgeWithRotation({
   body,signature,currentSecret:current,now,
  })).toBe(true);
  expect(verifyRecruiterMailBridgeWithRotation({
   body:body+"!",signature,currentSecret:current,now,
  })).toBe(false);
 });
 it("allows prior key only inside explicit 24-hour cutover",()=>{
  const signature=recruiterMailBridgeSignature(old,body);
  const base={body,signature,currentSecret:current,previousSecret:old,now};
  expect(verifyRecruiterMailBridgeWithRotation({
   ...base,previousExpiresAt:"2026-10-22T18:00:00.000Z",
  })).toBe(true);
  expect(verifyRecruiterMailBridgeWithRotation({
   ...base,previousExpiresAt:"2026-10-22T11:00:00.000Z",
  })).toBe(false);
  expect(verifyRecruiterMailBridgeWithRotation({
   ...base,previousExpiresAt:"2026-10-24T12:00:00.000Z",
  })).toBe(false);
 });
});
