import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/auth/legacy/otp/start/route";
import {MAX_AUTH_JSON_BYTES} from "@/lib/request-body";

const canonical=vi.hoisted(()=>({post:vi.fn()}));
vi.mock("@/app/api/auth/login/start/route",()=>({POST:canonical.post}));

beforeEach(()=>{
  canonical.post.mockReset();
  canonical.post.mockResolvedValue(new Response(JSON.stringify({accepted:true}),{status:202}));
});

function incoming(body:string|ArrayBuffer,headers:Record<string,string>={}){
  return new Request("https://lms.example/api/auth/legacy/otp/start",{
    method:"POST",body,
    headers:{host:"lms.example",origin:"https://lms.example","content-type":"application/json",...headers},
  });
}
describe("legacy OTP alias browser and size boundaries",()=>{
  it("rejects foreign Origin before reading or calling canonical login",async()=>{
    const response=await POST(incoming("not JSON",{origin:"https://attacker.example"}));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(canonical.post).not.toHaveBeenCalled();
  });
  it("rejects a missing Origin",async()=>{
    const req=incoming('{"email":"a@example.com"}');
    req.headers.delete("origin");
    expect((await POST(req)).status).toBe(403);
    expect(canonical.post).not.toHaveBeenCalled();
  });
  it("enforces the byte limit despite a forged Content-Length",async()=>{
    const response=await POST(incoming(JSON.stringify({email:"x".repeat(MAX_AUTH_JSON_BYTES)}),{"content-length":"0"}));
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({error:"REQUEST_TOO_LARGE"});
    expect(canonical.post).not.toHaveBeenCalled();
  });
  it("also rejects an excessively large declared Content-Length",async()=>{
    const response=await POST(incoming('{"email":"a@example.com"}',{"content-length":String(MAX_AUTH_JSON_BYTES+1)}));
    expect(response.status).toBe(413);
    expect(canonical.post).not.toHaveBeenCalled();
  });
  it("rejects invalid UTF-8, malformed JSON and unexpected fields",async()=>{
    const bytes=new Uint8Array([123,34,120,34,58,34,195,40,34,125]);
    for(const input of [bytes.buffer as ArrayBuffer,"{bad",JSON.stringify({email:"a@example.com",admin:true})]){
      const result=await POST(incoming(input));
      expect(result.status).toBe(400);
    }
    expect(canonical.post).not.toHaveBeenCalled();
  });
  it("rejects ambiguous email/phone inputs",async()=>{
    const r=await POST(incoming(JSON.stringify({email:"a@example.com",mobileNumber:"1234567890"})));
    expect(r.status).toBe(400);
    expect(canonical.post).not.toHaveBeenCalled();
  });
  it("normalizes email and strips stale framing headers before delegation",async()=>{
    const r=await POST(incoming('{"email":"a@example.com"}',{
      "content-length":"0","content-encoding":"gzip","transfer-encoding":"chunked",
    }));
    expect(r.status).toBe(202);
    expect(canonical.post).toHaveBeenCalledTimes(1);
    const adapted=canonical.post.mock.calls[0]?.[0] as Request;
    expect(adapted.headers.get("content-length")).toBeNull();
    expect(adapted.headers.get("transfer-encoding")).toBeNull();
    expect(adapted.headers.get("content-encoding")).toBeNull();
    expect(adapted.headers.get("content-type")).toBe("application/json");
    expect(adapted.headers.get("origin")).toBe("https://lms.example");
    expect(await adapted.json()).toEqual({channel:"EMAIL",contact:"a@example.com"});
  });
  it("preserves legacy phone login",async()=>{
    expect((await POST(incoming('{"mobileNumber":"919876543210"}'))).status).toBe(202);
    const adapted=canonical.post.mock.calls[0]?.[0] as Request;
    expect(await adapted.json()).toEqual({channel:"PHONE",contact:"919876543210"});
  });
});
