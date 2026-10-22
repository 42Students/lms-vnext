import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {courseThumbnailUrlSchema} from "@/modules/courses/validation";

describe("legacy course cover link safety",()=>{
 it("accepts public HTTPS course images and rejects ambiguous or private image destinations",()=>{
  expect(courseThumbnailUrlSchema.parse("https://cdn.example.com/course.png"))
   .toBe("https://cdn.example.com/course.png");
  for(const value of [
   "http://cdn.example.com/course.png",
   "https://user:pass@cdn.example.com/course.png",
   "https://127.0.0.1/admin",
   "https://192.168.1.5/course.png",
   "https://localhost/cover.png",
   "https://cdn.example.com/course.png#fragment",
   "javascript:alert(1)",
  ])expect(courseThumbnailUrlSchema.safeParse(value).success).toBe(false);
 });
 it("renders only validated links and gives bad legacy covers an accessible fallback",()=>{
  const page=readFileSync("src/components/courses/admin-course-overview.tsx","utf8");
  expect(page).toContain("courseThumbnailUrlSchema.safeParse(course.thumbnailUrl)");
  expect(page).toContain("<a href={safeCover}");
  expect(page).toContain("<img src={safeCover}");
  expect(page).toContain('aria-label="Course preview unavailable"');
  expect(page).not.toContain('course.thumbnailUrl?.startsWith("https://")');
 });
});
