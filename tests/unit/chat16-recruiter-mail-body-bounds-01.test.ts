import {describe,expect,it} from "vitest";
import {readBoundedRecruiterInboundBody} from "@/modules/placements/recruiter-mail-body-model";

const request=(body:BodyInit)=>new Request("https://lms.example.org/api/internal/placements/recruiter-message-inbound",{
 method:"POST",body,
});

describe("chat-16 signed recruiter email body limits",()=>{
 it("HR-MAIL-INBOUND-01 accepts exact raw bytes at the 20KB cap",async()=>{
  const body="a".repeat(20_000);
  await expect(readBoundedRecruiterInboundBody(request(body)))
   .resolves.toEqual({kind:"OK",body});
 });
 it("HR-MAIL-INBOUND-02 rejects oversize streamed bodies before HMAC or persistence",async()=>{
  await expect(readBoundedRecruiterInboundBody(request("a".repeat(20_001))))
   .resolves.toEqual({kind:"TOO_LARGE"});
  // The cap counts UTF-8 bytes, not UTF-16 characters.
  await expect(readBoundedRecruiterInboundBody(request("é".repeat(10_001))))
   .resolves.toEqual({kind:"TOO_LARGE"});
 });
 it("HR-MAIL-INBOUND-03 rejects malformed UTF-8 instead of silently changing signed bytes",async()=>{
  const invalid=new Blob([Uint8Array.of(0xff,0xfe,0x00)]);
  await expect(readBoundedRecruiterInboundBody(request(invalid)))
   .resolves.toEqual({kind:"INVALID_UTF8"});
 });
 it("HR-MAIL-INBOUND-04 preserves legitimate multibyte bodies without normalization",async()=>{
  const body="నమస్కారం 💬\nRecruiter reply\r\n";
  await expect(readBoundedRecruiterInboundBody(request(body)))
   .resolves.toEqual({kind:"OK",body});
 });
 it("HR-MAIL-INBOUND-05 rejects invalid cap arguments before allocating",async()=>{
  await expect(readBoundedRecruiterInboundBody(request("hello"),-1))
   .rejects.toThrow("INVALID_INBOUND_LIMIT");
  await expect(readBoundedRecruiterInboundBody(request("hello"),Number.NaN))
   .rejects.toThrow("INVALID_INBOUND_LIMIT");
 });
});
