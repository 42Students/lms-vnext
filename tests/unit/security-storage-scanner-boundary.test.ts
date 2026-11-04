import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {
 scannerCallbackRequestRejection,validScannerCallbackSecret,
} from "@/modules/storage/scan-verdict-request-guard";

const mocks=vi.hoisted(()=>({
 ready:vi.fn(()=>true),
 apply:vi.fn(),
}));
vi.mock("@/modules/storage/production-scan-verdict-service",()=>({
 productionScannerCallbackReady:mocks.ready,
 applyProductionScanVerdict:mocks.apply,
}));
import {POST} from "@/app/api/internal/storage/scan-verdict/route";

const secret="scanner-fixture-"+ "a".repeat(64);
const url="https://lms.example.test/api/internal/storage/scan-verdict";
const verdict={
 kind:"PROJECT_RESOURCE_FILE",fileId:"11111111-1111-4111-8111-111111111111",
 collegeId:"22222222-2222-4222-8222-222222222222",
 generation:"1730724000000",verdict:"REJECTED",
 completedAt:"2026-11-04T00:00:00.000Z",
};
function request(input:{
 address?:string;credential?:string|null;origin?:string;
 contentType?:string|null;contentLength?:string;body?:BodyInit;
}={}):Request{
 const headers=new Headers();
 if(input.credential!==null)headers.set("x-private-storage-scanner-key",input.credential??secret);
 if(input.contentType!==null)headers.set("content-type",input.contentType??"application/json");
 if(input.origin)headers.set("origin",input.origin);
 if(input.contentLength!==undefined)headers.set("content-length",input.contentLength);
 return new Request(input.address??url,{
  method:"POST",headers,body:input.body??JSON.stringify(verdict),
 });
}
function rejected(response:Response,status:number,error:string){
 expect(response.status).toBe(status);
 expect(response.headers.get("cache-control")).toBe("no-store");
 return response.json().then(body=>expect(body).toEqual({error}));
}
describe("SEC-storage-scanner machine callback identity and input gate",()=>{
 const prior=process.env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET;
 beforeEach(()=>{
  process.env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET=secret;
  mocks.ready.mockReset().mockReturnValue(true);
  mocks.apply.mockReset().mockResolvedValue({accepted:true,changed:true,scanStatus:"REJECTED"});
 });
 afterEach(()=>{
  if(prior===undefined)delete process.env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET;
  else process.env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET=prior;
 });
 it("accepts exactly one authenticated machine JSON callback and passes only parsed JSON to service",async()=>{
  const req=request({contentType:"application/json; charset=UTF-8"});
  expect(scannerCallbackRequestRejection(req,secret)).toBeNull();
  expect(req.bodyUsed).toBe(false);
  const response=await POST(req);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({accepted:true,changed:true,scanStatus:"REJECTED"});
  expect(mocks.apply).toHaveBeenCalledOnce();
  expect(mocks.apply).toHaveBeenCalledWith(verdict);
 });
 it("rejects browser Origin even when it matches the app host, before service or body access",async()=>{
  const req=request({origin:"https://lms.example.test"});
  await rejected(await POST(req),403,"INVALID_ORIGIN");
  expect(req.bodyUsed).toBe(false);
  expect(mocks.apply).not.toHaveBeenCalled();
 });
 it.each(["https://evil.invalid","null"])(
  "rejects any foreign or opaque browser Origin %s",async origin=>{
   await rejected(await POST(request({origin})),403,"INVALID_ORIGIN");
   expect(mocks.apply).not.toHaveBeenCalled();
  });
 it("does not treat a padded or too-short deployment credential as a valid equivalent",async()=>{
  expect(validScannerCallbackSecret(secret)).toBe(true);
  for(const configured of [secret+" "," "+secret,"short","","x".repeat(257),"x".repeat(31)]){
   expect(validScannerCallbackSecret(configured)).toBe(false);
   process.env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET=configured;
   await rejected(await POST(request({credential:configured})),403,"FORBIDDEN");
  }
  expect(mocks.apply).not.toHaveBeenCalled();
 });
 it("compares the full header secret exactly and rejects joined duplicate and oversize values",async()=>{
  for(const supplied of [secret+"x",secret+", "+secret,"x".repeat(257),"b".repeat(secret.length)]){
   expect(scannerCallbackRequestRejection(request({credential:supplied}),secret))
    .toBe("FORBIDDEN");
   await rejected(await POST(request({credential:supplied})),403,"FORBIDDEN");
  }
  expect(mocks.apply).not.toHaveBeenCalled();
 });
 it("rejects missing secret and scanner readiness before storage or DB calls",async()=>{
  await rejected(await POST(request({credential:null})),403,"FORBIDDEN");
  mocks.ready.mockReturnValueOnce(false);
  await rejected(await POST(request()),503,"SCANNER_NOT_READY");
  expect(mocks.apply).not.toHaveBeenCalled();
 });
 it.each(["?collegeId=foreign","?debug=true","?unknown=1"])(
  "denies caller-chosen query params %s",async suffix=>{
   const result=await POST(request({address:url+suffix}));
   await rejected(result,400,"INVALID_SCAN_VERDICT");
   expect(mocks.apply).not.toHaveBeenCalled();
  });
 it.each(["text/plain","application/x-www-form-urlencoded","application/json; charset=utf-16",null])(
  "requires canonical JSON Content-Type, not %s",async contentType=>{
   await rejected(await POST(request({contentType})),400,"INVALID_SCAN_VERDICT");
   expect(mocks.apply).not.toHaveBeenCalled();
  });
 it.each(["99999999","-1","garbage"])(
  "blocks invalid or overlimit claimed Content-Length %s before parsing",async contentLength=>{
   await rejected(await POST(request({contentLength})),400,"INVALID_SCAN_VERDICT");
   expect(mocks.apply).not.toHaveBeenCalled();
  });
 it("enforces the actual 2 KiB stream cap even without a Content-Length header",async()=>{
  await rejected(await POST(request({body:" ".repeat(2050)})),400,"INVALID_SCAN_VERDICT");
  expect(mocks.apply).not.toHaveBeenCalled();
 });
 it("rejects malformed JSON and invalid UTF-8 without invoking the scanner state writer",async()=>{
  await rejected(await POST(request({body:"{bad-json"})),400,"INVALID_SCAN_VERDICT");
  await rejected(await POST(request({body:new Uint8Array([0xff,0xfe])})),400,
   "INVALID_SCAN_VERDICT");
  expect(mocks.apply).not.toHaveBeenCalled();
 });
 it("redacts downstream scan, object, or DB failure details and never exposes the secret",async()=>{
  mocks.apply.mockRejectedValueOnce(new Error("private-object-key:"+secret));
  const response=await POST(request());
  await rejected(response,409,"SCAN_VERDICT_NOT_ACCEPTED");
  expect(mocks.apply).toHaveBeenCalledOnce();
 });
});
