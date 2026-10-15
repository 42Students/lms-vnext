import {expect,it} from "vitest";
import {readTpoBulkRequestBody,TpoBulkBodyError,TPO_BULK_BODY_MAX_BYTES}
 from "@/modules/placements/tpo-bulk-request-body";
function request(body:string,headers?:HeadersInit){
 return new Request("https://lms.example/api/placements/tpo/bulk-actions/preview",{
  method:"POST",headers:{"content-type":"application/json",...Object.fromEntries(new Headers(headers))},body,
 });
}
it("accepts a bounded JSON preview payload",async()=>{
 await expect(readTpoBulkRequestBody(request('{"target":"STUDENTS"}'))).resolves.toEqual({target:"STUDENTS"});
});
it("rejects bad JSON and non-object payloads without echoing input",async()=>{
 await expect(readTpoBulkRequestBody(request("not-json"))).rejects.toMatchObject({status:400});
 await expect(readTpoBulkRequestBody(request("[]"))).rejects.toMatchObject({status:400});
});
it("bounds actual UTF-8 bytes even when content-length is absent or untrusted",async()=>{
 await expect(readTpoBulkRequestBody(request("x".repeat(TPO_BULK_BODY_MAX_BYTES+1)))).rejects.toBeInstanceOf(TpoBulkBodyError);
 await expect(readTpoBulkRequestBody(request("{}",{"content-length":String(TPO_BULK_BODY_MAX_BYTES+1)}))).rejects.toMatchObject({status:413});
});

it("requires application/json rather than a form or browser text upload",async()=>{
 const req=new Request("https://lms.example/api/placements/tpo/bulk-actions/preview",{
  method:"POST",headers:{"content-type":"text/plain"},body:'{"target":"STUDENTS"}',
 });
 await expect(readTpoBulkRequestBody(req)).rejects.toMatchObject({status:415});
});
