import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/internal/inbound-mail/route";

const gateway=vi.hoisted(()=>({ingest:vi.fn()}));
vi.mock("@/modules/inbound-mail/verified-intake-service",()=>({
  ingestVerifiedInboundMail:gateway.ingest,
  VerifiedInboundMailError:class VerifiedInboundMailError extends Error {
    constructor(readonly code:string){super(code);}
  },
}));
const validSig="a".repeat(64);

beforeEach(()=>{
  gateway.ingest.mockReset();
  gateway.ingest.mockResolvedValue({accepted:true,replayed:false});
});

function inbound(body:string|ArrayBuffer,headers:Record<string,string>={},query=""){
 return new Request("https://lms.example/api/internal/inbound-mail"+query,{
  method:"POST",body,headers:{"x-inbound-mail-signature":validSig,...headers},
 });
}

describe("signed inbound email gateway boundary",()=>{
 it("rejects browser Origin, even with a syntactically valid signature",async()=>{
  const r=await POST(inbound("{}",{origin:"https://lms.example"}));
  expect(r.status).toBe(403);
  expect(r.headers.get("cache-control")).toBe("no-store");
  expect(gateway.ingest).not.toHaveBeenCalled();
 });
 it("rejects missing, malformed and oversized signatures before parsing",async()=>{
  for(const signature of ["","not-hex","a".repeat(63),"a".repeat(65),"x".repeat(64)]){
   const r=await POST(inbound("{not-json",{"x-inbound-mail-signature":signature}));
   expect(r.status).toBe(403);
  }
  expect(gateway.ingest).not.toHaveBeenCalled();
 });
 it("rejects unexpected worker query parameters without invoking ingestion",async()=>{
  const r=await POST(inbound("{}",{},"?tenant=other-college"));
  expect(r.status).toBe(400);
  expect(r.headers.get("cache-control")).toBe("no-store");
  expect(gateway.ingest).not.toHaveBeenCalled();
 });
 it("still accepts a legitimate bounded signed payload",async()=>{
  const raw='{"providerMessageId":"example","from":"test@example.com"}';
  const r=await POST(inbound(raw));
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({accepted:true,replayed:false});
  expect(gateway.ingest).toHaveBeenCalledExactlyOnceWith(raw,validSig);
 });
 it("rejects excess streamed bytes before reaching the signature verifier",async()=>{
  const r=await POST(inbound("x".repeat(20_001),{"content-length":"0"}));
  expect(r.status).toBe(413);
  expect(gateway.ingest).not.toHaveBeenCalled();
 });
 it("rejects non-UTF8 inbound bytes before HMAC verification",async()=>{
  const broken=new Uint8Array([195,40]).buffer as ArrayBuffer;
  const r=await POST(inbound(broken));
  expect(r.status).toBe(400);
  expect(gateway.ingest).not.toHaveBeenCalled();
 });
 it("only returns the private delivery ACK, never recipient routing details",async()=>{
  gateway.ingest.mockResolvedValue({accepted:true,replayed:true,routedAs:"PRIVATE_RECIPIENT"});
  const r=await POST(inbound("{}"));
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({accepted:true,replayed:true});
  expect(r.headers.get("cache-control")).toBe("no-store");
 });
});
