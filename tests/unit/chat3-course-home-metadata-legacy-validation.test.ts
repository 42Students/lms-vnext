import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {courseThumbnailUrlSchema,updateCourseInputSchema} from "@/modules/courses/validation";

describe("Super Admin Course Home metadata editor clone",()=>{
 it("limits Short display name to the legacy 255-character form contract",()=>{
  const source=readFileSync("src/components/courses/admin-course-display-editor.tsx","utf8");
  expect(source).toContain('value={shortTitle} maxLength={255}');
  expect(source).toContain('shortTitle.length>255');
  expect(source).toContain('name.trim().slice(0,255)');
  expect(updateCourseInputSchema.safeParse({
    expectedUpdatedAt:"2026-10-22T08:00:00.000Z",shortTitle:"X".repeat(256),
  }).success).toBe(false);
 });
 it("rejects internal, credentialed and non-HTTPS legacy thumbnails before PATCH",()=>{
  for(const url of [
   "https://alice:password@cdn.example.org/cover.jpg",
   "http://cdn.example.org/cover.jpg",
   "https://127.0.0.1/image.png",
   "https://192.168.1.2/image.png",
  ])expect(courseThumbnailUrlSchema.safeParse(url).success).toBe(false);
  const source=readFileSync("src/components/courses/admin-course-display-editor.tsx","utf8");
  expect(source).toContain("courseThumbnailUrlSchema.safeParse(thumbnailUrl.trim()).success");
  expect(source).toContain("!uploadedThumbnail");
 });
});
