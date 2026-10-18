import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 readTpoCommunicationBody,TpoCommunicationBodyError,
} from "@/modules/placements/tpo-communication-request-model";

const url="http://localhost/api/placements/tpo/settings/communication";
const jsonRequest=(body:string,extra:Record<string,string>={})=>
 new Request(url,{method:"PATCH",headers:{"content-type":"application/json",...extra},body});

describe("TPO-settings-audit-BODY-01 bounded JSON settings mutation requests",()=>{
 it("parses complete valid Unicode configuration without changing its primitive types",async()=>{
  const input={section:"SIGNATURE",emailSignature:"ప్రాంగణం · IIT Dharwad",expectedVersion:null};
  const body=await readTpoCommunicationBody(jsonRequest(JSON.stringify(input)));
  expect(body).toEqual(input);
  expect((body as typeof input).emailSignature).toBe(input.emailSignature);
 });
 it("refuses wrong media type, malformed JSON, empty body and invalid declared size",async()=>{
  await expect(readTpoCommunicationBody(
   new Request(url,{method:"PATCH",headers:{"content-type":"text/plain"},body:"{}"}),
  )).rejects.toMatchObject({code:"INVALID_JSON"});
  await expect(readTpoCommunicationBody(jsonRequest("{"))).rejects.toMatchObject({code:"INVALID_JSON"});
  await expect(readTpoCommunicationBody(jsonRequest(""))).rejects.toMatchObject({code:"INVALID_JSON"});
  await expect(readTpoCommunicationBody(jsonRequest("{}",{"content-length":"bad"})))
   .rejects.toMatchObject({code:"INVALID_JSON"});
 });
 it("refuses an over-limit stream even with Content-Length omitted",async()=>{
  const request=jsonRequest("x".repeat(9000));
  await expect(readTpoCommunicationBody(request)).rejects.toMatchObject({code:"BODY_TOO_LARGE"});
  await expect(readTpoCommunicationBody(jsonRequest("{}",{"content-length":"9000"})))
   .rejects.toMatchObject({code:"BODY_TOO_LARGE"});
  expect(new TpoCommunicationBodyError("BODY_TOO_LARGE").code).toBe("BODY_TOO_LARGE");
 });
 it("maps malformed and oversized payloads to stable 400/413 responses without echoing raw contents",()=>{
  const route=readFileSync("src/app/api/placements/tpo/settings/communication/route.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("readTpoCommunicationBody(request)");
  expect(route).toContain("TpoCommunicationBodyError");
  expect(route).toContain('status:error.code==="BODY_TOO_LARGE"?413:400');
  expect(route).toContain('{error:"INVALID_REQUEST"}');
  expect(route).not.toContain("await request.json()");
 });
});
