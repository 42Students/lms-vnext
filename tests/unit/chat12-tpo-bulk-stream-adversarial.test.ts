import {describe,expect,it} from "vitest";
import {readTpoBulkRequestBody,TPO_BULK_BODY_MAX_BYTES} from "@/modules/placements/tpo-bulk-request-body";

function upload(chunks:Uint8Array[], declaredLength?:string, contentType="application/json"){
 const headers=new Headers({"content-type":contentType});
 if(declaredLength!==undefined)headers.set("content-length",declaredLength);
 const body=new ReadableStream<Uint8Array>({
  start(controller){for(const chunk of chunks)controller.enqueue(chunk);controller.close();}
 });
 return new Request("http://localhost/api/placements/tpo/bulk-actions/confirm",{
  method:"POST",headers,body,duplex:"half",
 } as RequestInit & {duplex:"half"});
}
describe("TPO-BREAK-bulk-transport-01 streamed mutation request validation",()=>{
 it("accepts an exact JSON object when a multibyte UTF-8 codepoint crosses chunk boundaries",async()=>{
  const encoded=new TextEncoder().encode('{"note":"✅ handover"}');
  const marker=encoded.indexOf(0xe2);
  expect(marker).toBeGreaterThan(0);
  const parsed=await readTpoBulkRequestBody(upload([
   encoded.slice(0,marker+1),encoded.slice(marker+1,marker+2),
   encoded.slice(marker+2),
  ]));
  expect(parsed.note).toBe("✅ handover");
 });
 it("fails closed on invalid UTF-8, primitive JSON, arrays and missing JSON media type",async()=>{
  const prefix=new TextEncoder().encode('{"note":"');
  const suffix=new TextEncoder().encode('"}');
  await expect(readTpoBulkRequestBody(upload([prefix,new Uint8Array([0xff]),suffix]))).rejects.toMatchObject({status:400});
  await expect(readTpoBulkRequestBody(upload([new TextEncoder().encode('"string"')]))).rejects.toMatchObject({status:400});
  await expect(readTpoBulkRequestBody(upload([new TextEncoder().encode("[]")]))).rejects.toMatchObject({status:400});
  await expect(readTpoBulkRequestBody(upload([new TextEncoder().encode("{}")],undefined,"text/plain"))).rejects.toMatchObject({status:415});
 });
 it("applies actual streamed byte cap when the caller lies about Content-Length",async()=>{
  const small=new Uint8Array(1024);
  const chunks=Array.from({length:Math.ceil((TPO_BULK_BODY_MAX_BYTES+1)/1024)},()=>small);
  await expect(readTpoBulkRequestBody(upload(chunks,"1"))).rejects.toMatchObject({status:413});
  await expect(readTpoBulkRequestBody(upload([small],"garbled"))).rejects.toMatchObject({status:413});
 });
 it("does not confuse a valid maximum declared length with a valid JSON body",async()=>{
  await expect(readTpoBulkRequestBody(upload([new Uint8Array([0x7b,0x7d])],String(TPO_BULK_BODY_MAX_BYTES)))).resolves.toEqual({});
  await expect(readTpoBulkRequestBody(upload([new Uint8Array([0x7b])],String(TPO_BULK_BODY_MAX_BYTES)))).rejects.toMatchObject({status:400});
 });
});
