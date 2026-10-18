import {describe,expect,it} from "vitest";
import {readFacultyQuizCommandBody,facultyQuizAcceptsContentType,
 FacultyQuizBodyError,FACULTY_QUIZ_COMMAND_LIMIT_BYTES} from "@/modules/courses/faculty-quiz-request-body";

function request(body:string|Uint8Array,contentType="application/json",extra:Record<string,string>={}){
 return new Request("https://college.invalid/api/courses/quizzes",{
  method:"POST",headers:{"content-type":contentType,...extra},
  body:typeof body==="string"?body:new Uint8Array(body).buffer,
 });
}
async function expectBodyError(request:Request,code:FacultyQuizBodyError["code"],status:number){
 try{await readFacultyQuizCommandBody(request);throw new Error("Expected the body parser to reject");}
 catch(e){
  expect(e).toBeInstanceOf(FacultyQuizBodyError);
  expect((e as FacultyQuizBodyError).code).toBe(code);
  expect((e as FacultyQuizBodyError).status).toBe(status);
 }
}
describe("COURSES-BREAK-FACULTY-02 bounded JSON and payload-safety adversarial requests",()=>{
 it("accepts application/json and structured +json types regardless of media-type casing/charset",()=>{
  for(const type of ["application/json","Application/JSON; charset=utf-8"," application/merge-patch+json ",
   "application/vnd.api+json;charset=utf-8"]){
   expect(facultyQuizAcceptsContentType(type)).toBe(true);
  }
  for(const type of [null,"","text/json","text/plain","application/x-www-form-urlencoded",
   "application/octet-stream","application/jsonp"]){
   expect(facultyQuizAcceptsContentType(type)).toBe(false);
  }
 });
 it("parses valid bounded JSON without trusting client role/college (later schema owns command)",async()=>{
  expect(await readFacultyQuizCommandBody(request(JSON.stringify({title:"Test",count:2})))).toEqual({title:"Test",count:2});
  expect(await readFacultyQuizCommandBody(request("[1,2]","application/vnd.acme+json"))).toEqual([1,2]);
 });
 it("returns safe explicit 415 for unsupported content types instead of parsing arbitrary uploaded body",async()=>{
  await expectBodyError(request("<script>","text/html"),"UNSUPPORTED_QUIZ_CONTENT_TYPE",415);
 });
 it("rejects over-declared request size before streaming untrusted bytes",async()=>{
  const limit=FACULTY_QUIZ_COMMAND_LIMIT_BYTES;
  expect(limit).toBe(16*1024*1024);
  await expectBodyError(request("{}","application/json",{"content-length":String(limit+1)}),
   "FACULTY_QUIZ_BODY_TOO_LARGE",413);
 });
 it("rejects empty/malformed JSON with stable 400 rather than leaking parser exceptions",async()=>{
  for(const body of ["", "{", '{"a":}', "NaN", "undefined"]){
   await expectBodyError(request(body),"INVALID_QUIZ_JSON",400);
  }
 });
 it("rejects invalid UTF-8 stream bytes without returning source error text",async()=>{
  await expectBodyError(request(new Uint8Array([0x7b,0x22,0xff,0x22,0x7d])),
   "INVALID_QUIZ_JSON",400);
 });
});
