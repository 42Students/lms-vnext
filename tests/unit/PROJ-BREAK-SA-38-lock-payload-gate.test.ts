import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {readLimitedProjectLockInput} from "@/modules/projects/admin-lock-request-model";

const req=(body:string,headers:Record<string,string>={})=>
 new Request("https://local.invalid/api/projects/lock",{
  method:"POST",body,headers:{"content-type":"application/json",...headers},
 });

describe("PROJ-BREAK-SA-38 bounded streaming submission-lock input",()=>{
 it("accepts a valid JSON command without altering the reason",async()=>{
  const value={reason:"Mentor review completed"};
  expect(await readLimitedProjectLockInput(req(JSON.stringify(value))))
   .toEqual({ok:true,value});
 });
 it("rejects malformed JSON and misleading content-length headers",async()=>{
  for(const input of [
    req('{"reason":'),
    req('{"reason":"fine"}',{"content-length":"9000"}),
    req('{}',{"content-length":"invalid"}),
  ]) expect(await readLimitedProjectLockInput(input)).toEqual({ok:false});
 });
 it("caps actual streamed bytes when an attacker advertises a small payload",async()=>{
  const body=JSON.stringify({reason:"x".repeat(8200)});
  expect(await readLimitedProjectLockInput(req(body,{"content-length":"8"})))
   .toEqual({ok:false});
  // UTF-8 bytes, not JS character count, are the security boundary.
  expect(await readLimitedProjectLockInput(req(JSON.stringify({
   reason:"💡".repeat(2100),
  })))).toEqual({ok:false});
 });
 it("checks same-origin before streaming and never authenticates malformed payloads",()=>{
  const code=readFileSync("src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts","utf8");
  expect(code.indexOf("isSameOriginRequest(request)")).toBeLessThan(
   code.indexOf("readLimitedProjectLockInput(request)"));
  expect(code.indexOf("readLimitedProjectLockInput(request)")).toBeLessThan(
   code.indexOf("getCurrentRequestContext()"));
  expect(code).toContain('error:"INVALID_REQUEST"');
  expect(code).toContain('Cache-Control":"private, no-store"');
 });
});
