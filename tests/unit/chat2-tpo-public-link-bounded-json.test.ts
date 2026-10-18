import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
const endpoint="https://college.example.test/api/placements/tpo/settings/communication";
const post=(body?:string,headers?:Record<string,string>)=>new Request(endpoint,{
 method:"POST",headers:{"Content-Type":"application/json",...headers},...(body===undefined?{}:{body}),
});
describe("TPO-settings-audit-55 bounded recruiter and public join-link write boundaries",()=>{
 it("parses a small JSON object and returns untrusted payload without inventing any tenant",async()=>{
  const obj=await readTpoSettingsBody(post(JSON.stringify({scope:"COLLEGE",action:"CREATE",confirmed:true})));
  expect(obj).toEqual({scope:"COLLEGE",action:"CREATE",confirmed:true});
  expect(obj).not.toHaveProperty("collegeId");
 });
 it("rejects absent body, incorrect content type and non-JSON input",async()=>{
  await expect(readTpoSettingsBody(post())).rejects.toMatchObject({code:"INVALID_JSON"});
  await expect(readTpoSettingsBody(post("{}",{"Content-Type":"text/plain"}))).rejects.toMatchObject({code:"INVALID_JSON"});
  await expect(readTpoSettingsBody(post("{unclosed"))).rejects.toMatchObject({code:"INVALID_JSON"});
  await expect(readTpoSettingsBody(post("{}",{"Content-Length":"Infinity"}))).rejects.toMatchObject({code:"INVALID_JSON"});
 });
 it("rejects forged large Content-Length before allocating or reading body",async()=>{
  await expect(readTpoSettingsBody(post("{}",
   {"Content-Length":"999999"}))).rejects.toMatchObject({code:"BODY_TOO_LARGE"});
 });
 it("rejects a large body even with no Content-Length header",async()=>{
  const content=JSON.stringify({note:"x".repeat(9000)});
  const request=post(content);
  expect(request.headers.has("content-length")).toBe(false);
  await expect(readTpoSettingsBody(request)).rejects.toMatchObject({code:"BODY_TOO_LARGE"});
 });
 it("all public link and recruiter grant POST handlers check origin before bounded body",()=>{
  const paths=[
   "src/app/api/placements/tpo/public-join-links/route.ts",
   "src/app/api/placements/tpo/public-join-links/enabled/route.ts",
   "src/app/api/placements/tpo/settings/recruiter-grants/route.ts",
  ];
  for(const path of paths){
   const s=readFileSync(path,"utf8");
   expect(s,path).toContain("isSameOriginRequest(request)");
   expect(s,path).toContain("readTpoSettingsBody(request)");
   expect(s,path).toContain("TpoCommunicationBodyError");
   expect(s,path).toContain("BODY_TOO_LARGE");
   expect(s,path).toContain("status:403");
   expect(s,path).toContain("status:400");
   expect(s,path).toContain("413");
   expect(s.indexOf("isSameOriginRequest(request)"),path).toBeLessThan(s.indexOf("readTpoSettingsBody(request)"));
   expect(s,path).not.toContain("await request.json()");
  }
 });
});
