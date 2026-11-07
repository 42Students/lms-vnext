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
  // route() runs origin -> authentication -> permission before the handler; the bounded read happens inside it.
  expect(code).toContain('import { route } from "@/security/route"');
  expect(code).toMatch(/export const POST = route\(\s*\{ auth: "user"/);
  expect(code).not.toMatch(/export async function POST\(/);
  expect(code.indexOf("route(")).toBeLessThan(code.indexOf("readLimitedProjectLockInput(request)"));
  // A malformed payload is rejected with the generic error inside the handler.
  expect(code).toContain('error:"INVALID_REQUEST"');
  expect(code).toContain('Cache-Control":"private, no-store"');
 });
});
