import {describe,expect,it} from "vitest";
import {parseHrBellResponse} from "@/modules/placements/hr-recruiter-bell-model";
import {readFileSync} from "node:fs";

const id="11111111-1111-4111-8111-111111111111";
const valid={status:"READY",unread:1,items:[{id,label:"Drive updated",unread:true,
 at:"2026-10-18T10:00:00.000Z",href:"/hr/placements/jobs/"+id}]};
describe("HR-BREAK-BELL-PAYLOAD-35 verified HR notification shell response",()=>{
 it("retains authorized job links and unread counts without losing ordinary copy",()=>{
  expect(parseHrBellResponse(valid)).toEqual(valid);
  expect(parseHrBellResponse({status:"NO_ACCESS",unread:0,items:[]})).toEqual({
   status:"NO_ACCESS",unread:0,items:[],
  });
 });
 it.each([
  null,[],{status:"READY",unread:1,items:null},
  {...valid,items:[{...valid.items[0],href:"https://other.example/private"}]},
  {...valid,items:[{...valid.items[0],href:"javascript:alert(1)"}]},
  {...valid,items:[{...valid.items[0],href:"/admin/users/"+id}]},
  {...valid,items:[{...valid.items[0],at:"not-a-date"}]},
  {...valid,items:[{...valid.items[0],unread:"yes"}]},
  {...valid,items:[{...valid.items[0],label:"a".repeat(501)}]},
  {...valid,unread:-1},{...valid,unread:1.5},
  {status:"NO_ACCESS",unread:1,items:valid.items},
 ])("fails closed on malformed, foreign or expired bell data %j",value=>{
  expect(parseHrBellResponse(value)).toBeNull();
 });
 it("wires strict parsing before setting any HR shell notification state",()=>{
  const source=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  expect(source).toContain("const data=parseHrBellResponse(payload)");
  expect(source).toContain('if(!data)throw Error("INVALID_BELL_RESPONSE")');
  expect(source).toContain("setState(null);setError(");
 });
});
