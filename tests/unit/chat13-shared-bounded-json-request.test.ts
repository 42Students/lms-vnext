import {describe,expect,it} from "vitest";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";

const request=(text:string,declared?:string)=>
 new Request("https://local.invalid/admin/write",{
  method:"POST",body:text,
  headers:declared===undefined?{}:{"content-length":declared},
 });

describe("SA-ADMIN-BODY-19 shared streaming POST body protection",()=>{
 it("passes a valid bounded command unchanged to service validation",async()=>{
  const command={confirmed:true,membershipIds:["a","b"]};
  expect(await readBoundedJsonRequest(request(JSON.stringify(command)),8192))
   .toEqual({ok:true,value:command});
 });
 it("does not trust Content-Length when the actual stream exceeds the cap",async()=>{
  const enormous=JSON.stringify({reason:"x".repeat(9000)});
  expect(await readBoundedJsonRequest(request(enormous,"4"),8192))
   .toEqual({ok:false});
  expect(await readBoundedJsonRequest(request("{}", "9999999"),8192))
   .toEqual({ok:false});
 });
 it("rejects malformed JSON, non-decimal lengths and invalid cap configuration",async()=>{
  expect(await readBoundedJsonRequest(request("{"),8192)).toEqual({ok:false});
  expect(await readBoundedJsonRequest(request("{}","0x10"),8192)).toEqual({ok:false});
  expect(await readBoundedJsonRequest(request("{}"),0)).toEqual({ok:false});
  expect(await readBoundedJsonRequest(request("{}"),Number.NaN)).toEqual({ok:false});
 });
});
