import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("verified recruiter email reply provenance",()=>{
 it("stores the original full receipt and only exposes stripped text for posted replies",()=>{
  const source=readFileSync("src/modules/placements/recruiter-message-email-inbound-service.ts","utf8");
  const schema=readFileSync("src/db/schema/inbound-mail.ts","utf8");
  expect(schema).toContain('originalBodyPlain: text("original_body_plain")');
  expect(source).toContain("originalBodyPlain:fullText");
  expect(source).toContain('bodyPlain:routedStatus==="POSTED"?replyBody:fullText');
  expect(source).toContain("bodyPreview:replyBody.slice(0,1000)");
  expect(source).toContain('kind:"REPLY",routingStatus:"POSTED",status:"RESOLVED"');
  expect(source).toContain("bodyPlain:replyBody,bodyPreview:replyBody.slice(0,1000)");
 });
 it("requires gateway HMAC and authorized sender before posting",()=>{
  const source=readFileSync("src/modules/placements/recruiter-message-email-inbound-service.ts","utf8");
  expect(source).toContain("verifyRecruiterMailBridgeWithRotation({");
  expect(source).toContain("body:rawBody,signature,currentSecret:secret");
  expect(source).toContain('previousSecret:env["RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_SECRET"]');
  expect(source).toContain('previousExpiresAt:env["RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_UNTIL"]');
  expect(source).toContain("senderVerified(input.auth,input.from)");
  expect(source).toContain('return auditResult("NOT_VERIFIED")');
  expect(source).toContain('return auditResult("WRONG_SENDER")');
  expect(source).toContain("await notifyTpoOfRecruiterMessage(tx,{");
 });
});
