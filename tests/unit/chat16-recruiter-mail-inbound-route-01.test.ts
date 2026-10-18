import {beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {acceptAuthenticatedRecruiterEmailReply} from "@/modules/placements/recruiter-message-email-inbound-service";
import {POST} from "@/app/api/internal/placements/recruiter-message-inbound/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/recruiter-message-email-inbound-service",()=>({
 acceptAuthenticatedRecruiterEmailReply:vi.fn(),
}));
const endpoint="https://lms.example.org/api/internal/placements/recruiter-message-inbound";
const request=(body:BodyInit,signature="signed")=>new Request(endpoint,{
 method:"POST",body,headers:{"x-recruiter-mail-signature":signature},
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(acceptAuthenticatedRecruiterEmailReply).mockResolvedValue({
  accepted:true,replayed:false,
 });
});

describe("chat-16 inbound recruiter mail POST guard",()=>{
 it("HR-MAIL-ROUTE-01 denies cross-origin mail without invoking the bridge",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const res=await POST(request("anything"));
  expect(res.status).toBe(403);
  expect(acceptAuthenticatedRecruiterEmailReply).not.toHaveBeenCalled();
 });
 it("HR-MAIL-ROUTE-02 rejects oversize request bytes before signature verification",async()=>{
  const res=await POST(request("é".repeat(10_001)));
  expect(res.status).toBe(413);
  expect(acceptAuthenticatedRecruiterEmailReply).not.toHaveBeenCalled();
 });
 it("HR-MAIL-ROUTE-03 rejects invalid UTF-8 before authorizing a forged sender",async()=>{
  const res=await POST(request(new Blob([Uint8Array.of(0xff)])));
  expect(res.status).toBe(400);
  expect(acceptAuthenticatedRecruiterEmailReply).not.toHaveBeenCalled();
 });
 it("HR-MAIL-ROUTE-04 forwards the unmodified body and supplied signature",async()=>{
  const body='{"from":"person@example.org","text":"नमस्ते"}';
  const res=await POST(request(body,"sha256signature"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({accepted:true,replayed:false});
  expect(acceptAuthenticatedRecruiterEmailReply)
   .toHaveBeenCalledWith(body,"sha256signature");
  expect(acceptAuthenticatedRecruiterEmailReply).toHaveBeenCalledTimes(1);
  expect(res.headers.get("cache-control")).toBe("no-store");
 });
 it("HR-MAIL-ROUTE-05 denies invalid signatures and hides service failures",async()=>{
  vi.mocked(acceptAuthenticatedRecruiterEmailReply)
   .mockResolvedValueOnce({accepted:false,replayed:false})
   .mockRejectedValueOnce(new Error("sensitive database detail"));
  const rejected=await POST(request("message","wrong"));
  expect(rejected.status).toBe(403);
  const outage=await POST(request("message","signed"));
  expect(outage.status).toBe(503);
  expect(await outage.text()).not.toContain("sensitive database detail");
 });
});
