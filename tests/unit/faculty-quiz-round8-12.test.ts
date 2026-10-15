import {describe,expect,it} from "vitest";
import {facultyQuizAcceptsContentType,readFacultyQuizCommandBody}
 from "@/modules/courses/faculty-quiz-request-body";
describe("Faculty Quiz command media type",()=>{
 it("accepts JSON and compatible structured JSON media types",()=>{
  expect(facultyQuizAcceptsContentType("application/json; charset=utf-8")).toBe(true);
  expect(facultyQuizAcceptsContentType("application/vnd.campus+json")).toBe(true);
  expect(facultyQuizAcceptsContentType("APPLICATION/JSON")).toBe(true);
 });
 it("rejects missing, form, text and JSON-like content types",()=>{
  for(const mediaType of [null,"text/plain","application/x-www-form-urlencoded","application/jsonp"]){
   expect(facultyQuizAcceptsContentType(mediaType)).toBe(false);
  }
 });
 it("rejects malformed request content type before downstream writes",async()=>{
  const request=new Request("http://localhost/command",{method:"POST",body:"{}"});
  await expect(readFacultyQuizCommandBody(request)).rejects.toMatchObject({
   code:"UNSUPPORTED_QUIZ_CONTENT_TYPE",status:415,
  });
 });
});
