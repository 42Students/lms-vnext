import {describe,expect,it} from "vitest";
import {mentorPdfEmbedUrl} from
 "@/modules/projects/mentor-pdf-evidence-controls-model";
describe("Mentor PDF evidence navigation",()=>{
 it("sets page and zoom while preserving signed original query tokens",()=>{
  const result=mentorPdfEmbedUrl(
   "https://files.example/weekly.pdf?token=signed&expiry=300",4,125);
  expect(result).toBe("https://files.example/weekly.pdf?token=signed&expiry=300#page=4&zoom=125");
 });
 it("bounds page and zoom inputs instead of creating arbitrary fragments",()=>{
  expect(mentorPdfEmbedUrl("https://files.example/a.pdf",-20,900))
   .toBe("https://files.example/a.pdf#page=1&zoom=200");
  expect(mentorPdfEmbedUrl("https://files.example/a.pdf",Infinity,NaN))
   .toBe("https://files.example/a.pdf#page=1&zoom=100");
 });
 it("rejects local/script and embedded-credential URLs",()=>{
  for(const href of ["file:///secrets", "javascript:alert(1)",
    "https://alice:secret@files.example/report.pdf","not a URL"]){
   expect(mentorPdfEmbedUrl(href,1,100)).toBeNull();
  }
 });
});
