import {describe,expect,it} from "vitest";
import {facultyContentExternalHref,facultyYouTubeEmbed} from "@/modules/courses/faculty-content-preview-model";
describe("COURSES-WEAK-FACULTY-PREVIEW-01 safe content links / embed rendering",()=>{
 const valid="https://www.youtube.com/watch?v=dQw4w9WgXcQ";
 it("only resolves URL values for intended external content kinds",()=>{
  for(const kind of ["YOUTUBE","RESOURCE","LIVE_CLASS"]){
   expect(facultyContentExternalHref(kind,valid)).toBe(valid);
  }
  for(const kind of ["FILE","VIDEO","PDF","UNKNOWN"]){
   expect(facultyContentExternalHref(kind,valid)).toBeNull();
  }
  expect(facultyContentExternalHref("YOUTUBE",null)).toBeNull();
 });
 it("denies arbitrary origins, credentials, insecure or javascript protocols and spoofed YouTube domains",()=>{
  for(const target of [
   "http://youtube.com/watch?v=dQw4w9WgXcQ",
   "javascript:alert(1)",
   "https://youtube.com.evil.invalid/watch?v=dQw4w9WgXcQ",
   "https://user:password@youtube.com/watch?v=dQw4w9WgXcQ",
   "https://evil.invalid/watch?v=dQw4w9WgXcQ",
   "not-a-url",
  ]){
   expect(facultyContentExternalHref("YOUTUBE",target)).toBeNull();
   expect(facultyYouTubeEmbed(target)).toBeNull();
  }
 });
 it("embeds only validated 11-character YouTube IDs under privacy-friendly nocookie host",()=>{
  expect(facultyYouTubeEmbed(valid)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  expect(facultyYouTubeEmbed("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  expect(facultyYouTubeEmbed("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  expect(facultyYouTubeEmbed("https://youtube.com/watch?v=short")).toBeNull();
  expect(facultyYouTubeEmbed("https://youtube.com/watch?v=%3Cscript%3E")).toBeNull();
  expect(facultyYouTubeEmbed(null)).toBeNull();
 });
});
