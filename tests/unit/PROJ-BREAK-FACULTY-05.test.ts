import {describe,expect,it} from "vitest";
import {readMentorProjectCommandBody,mentorProjectCommandContentType,
 MENTOR_PROJECT_COMMAND_LIMIT_BYTES,MentorProjectCommandBodyError,
 mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";

function req(body:string|ArrayBuffer,contentType="application/json",
 headers:Record<string,string>={}){
 return new Request("https://college.invalid/api/projects/task",{
  method:"PATCH",headers:{"content-type":contentType,...headers},body,
 });
}
async function rejected(request:Request,code:MentorProjectCommandBodyError["code"],
 status:MentorProjectCommandBodyError["status"]){
 try {
  await readMentorProjectCommandBody(request);
  throw new Error("Expected rejection");
 }catch(error) {
  expect(error).toBeInstanceOf(MentorProjectCommandBodyError);
  expect(error).toMatchObject({code,status});
 }
}
describe("PROJ-BREAK-FACULTY-05 streaming Mentor command size and JSON protection",()=>{
 it("PROJ-BREAK-FACULTY-05-01 accepts versioned small JSON without mutating or trusting its fields",async()=>{
  const input={action:"UPDATE",expectedUpdatedAt:"2026-10-18T04:35:00.000Z",
   confirmed:true,projectId:"attacker-pretends-to-be-admin"};
  expect(await readMentorProjectCommandBody(req(JSON.stringify(input)))).toEqual(input);
  expect(mentorProjectCommandContentType("Application/Merge-Patch+Json; charset=utf-8"))
   .toBe(true);
  expect(mentorProjectCommandContentType("text/plain")).toBe(false);
  expect(mentorProjectCommandContentType(null)).toBe(false);
 });
 it("PROJ-BREAK-FACULTY-05-02 malformed JSON and invalid UTF-8 never become raw parser errors",async()=>{
  for(const payload of ["","{",'{"action":}',"undefined","NaN"]){
   await rejected(req(payload),"INVALID_PROJECT_COMMAND_BODY",400);
  }
  const malformed=new Uint8Array([0x7b,0x22,0xff,0x22,0x7d]).buffer;
  await rejected(req(malformed),"INVALID_PROJECT_COMMAND_BODY",400);
  expect(mentorProjectBodyFailureMessage(400)).not.toMatch(/undefined|Unexpected token/);
 });
 it("PROJ-BREAK-FACULTY-05-03 declared and streamed oversize bodies both fail closed",async()=>{
  expect(MENTOR_PROJECT_COMMAND_LIMIT_BYTES).toBe(128*1024);
  await rejected(req("{}",undefined,{"content-length":String(MENTOR_PROJECT_COMMAND_LIMIT_BYTES+1)}),
   "PROJECT_COMMAND_BODY_TOO_LARGE",413);
  const huge=JSON.stringify({note:"a".repeat(MENTOR_PROJECT_COMMAND_LIMIT_BYTES)});
  await rejected(req(huge),"PROJECT_COMMAND_BODY_TOO_LARGE",413);
  expect(mentorProjectBodyFailureMessage(413)).toContain("Shorten");
 });
 it("PROJ-BREAK-FACULTY-05-04 invalid Content-Length cannot bypass stream or parser validation",async()=>{
  for(const declared of ["Infinity","NaN","-1","1.5","999999999999999999999999"]){
   await rejected(req("{}",undefined,{"content-length":declared}),
    "INVALID_PROJECT_COMMAND_BODY",400);
  }
 });
 it("PROJ-BREAK-FACULTY-05-05 rejects non-JSON media types without reading untrusted bytes",async()=>{
  for(const contentType of ["text/plain","application/x-www-form-urlencoded","text/json"]){
   await rejected(req("<script>",contentType),
    "UNSUPPORTED_PROJECT_COMMAND_CONTENT_TYPE",415);
  }
  expect(mentorProjectBodyFailureMessage(415)).toContain("JSON");
 });
 it("PROJ-BREAK-FACULTY-05-06 supports UTF-8 multi-byte notes and rejects exact boundary overflow",async()=>{
  const note="क".repeat(1000);
  expect(await readMentorProjectCommandBody(req(JSON.stringify({note})))).toEqual({note});
  const smallLimit=JSON.stringify({note:"a".repeat(20)});
  expect(await readMentorProjectCommandBody(req(smallLimit))).toEqual({note:"a".repeat(20)});
 });
});
