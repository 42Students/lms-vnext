import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {readRecruiterJsonBody,RecruiterJsonBodyError}
  from "@/modules/placements/recruiter-json-request";
const make=(value:string,headers?:Record<string,string>)=>
  new Request("https://college.example/api/test",{method:"POST",body:value,headers});
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("HR-request-limits-01 bounded streamed JSON for recruiter mutations",()=>{
 it("accepts structured valid payloads and Unicode across text decoding",async()=>{
  const body={title:"Recruiting – इंजीनियर",rounds:[{kind:"INTERVIEW",name:"Technical"}]};
  await expect(readRecruiterJsonBody(make(JSON.stringify(body)),4096)).resolves.toEqual(body);
 });
 it("rejects valid JSON that exceeds cap even when Content-Length is omitted",async()=>{
  const input=make(JSON.stringify({notes:"x".repeat(1000)}));
  await expect(readRecruiterJsonBody(input,100)).rejects.toMatchObject({kind:"TOO_LARGE"});
 });
 it("rejects a declared Content-Length above cap before reading the stream",async()=>{
  await expect(readRecruiterJsonBody(make('{"safe":true}',{"content-length":"9999"}),100))
    .rejects.toMatchObject({kind:"TOO_LARGE"});
 });
 it.each(["","{broken","null trailing","[1,"] )("denies malformed/truncated JSON %#",async(raw)=>{
  const input=raw?make(raw):new Request("https://college.example/api/test",{method:"POST"});
  await expect(readRecruiterJsonBody(input,100)).rejects.toBeInstanceOf(RecruiterJsonBodyError);
 });
 it("fails closed on invalid cap, not accidentally allowing infinite bodies",async()=>{
  await expect(readRecruiterJsonBody(make("{}"),0)).rejects.toMatchObject({kind:"INVALID_JSON"});
  await expect(readRecruiterJsonBody(make("{}"),Number.POSITIVE_INFINITY)).rejects.toMatchObject({kind:"INVALID_JSON"});
 });
 const handlers=[
  "drives/requests/route.ts",
  "drives/proposal/route.ts",
  "notifications/[notificationId]/read/route.ts",
  "profile/details/route.ts",
  "profile/route.ts",
 ];
 it.each(handlers)("HR-request-origin-limits checks same-origin before bounded read and maps errors: %s",(file)=>{
  const s=source("src/app/api/placements/recruiter/"+file);
  expect(s).toContain("isSameOriginRequest(request)");
  expect(s).toContain("readRecruiterJsonBody(request)");
  expect(s).toContain("RecruiterJsonBodyError");
  expect(s).toContain('status:');
  expect(s).toContain("413");
  expect(s).toContain("400");
  expect(s).toContain("getCurrentRequestContext");
 });
 it("GET drive requests does not write; its only API mutation methods are guarded",()=>{
  const s=source("src/app/api/placements/recruiter/drives/requests/route.ts");
  const get=s.slice(s.indexOf("export async function GET("),s.indexOf("export async function POST("));
  expect(get).toContain("listOwnRecruiterDriveRequests");
  expect(get).not.toContain("createOwnRecruiterDriveRequest(");
  expect(get).not.toContain("updateOwnRecruiterDriveRequest(");
 });
});
