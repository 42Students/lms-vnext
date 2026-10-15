import {it,expect} from "vitest";
import {FACULTY_QUIZ_COMMAND_LIMIT_BYTES,FacultyQuizBodyError,readFacultyQuizCommandBody}
 from "@/modules/courses/faculty-quiz-request-body";
const url="http://localhost/api/courses/faculty/quizzes/123/command";
it("parses valid bounded JSON as unknown data for downstream Zod",async()=>{
 const result=await readFacultyQuizCommandBody(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"CREATE"})}));
 expect(result).toEqual({action:"CREATE"});
});
it("rejects malformed bodies without propagating user content",async()=>{
 await expect(readFacultyQuizCommandBody(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:"{private"})))
  .rejects.toMatchObject({code:"INVALID_QUIZ_JSON",status:400});
});
it("rejects an oversized declared Content-Length before reading",async()=>{
 const request=new Request(url,{method:"POST",headers:{"content-type":"application/json","content-length":String(FACULTY_QUIZ_COMMAND_LIMIT_BYTES+1)},body:"{}"});
 await expect(readFacultyQuizCommandBody(request)).rejects.toMatchObject({code:"FACULTY_QUIZ_BODY_TOO_LARGE",status:413});
});
it("limits streamed bytes even when Content-Length is missing",async()=>{
 const request=new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:"x".repeat(FACULTY_QUIZ_COMMAND_LIMIT_BYTES+1)});
 await expect(readFacultyQuizCommandBody(request)).rejects.toBeInstanceOf(FacultyQuizBodyError);
});
