import {describe,expect,it} from "vitest";
import {createLessonContentInputSchema} from "@/modules/courses/validation";
import {readFileSync} from "node:fs";
const id="11111111-1111-4111-8111-111111111111";
describe("COL-course-tabs-01/02 authoring without file storage",()=>{
 it("accepts YouTube content and rejects unrelated domains",()=>{
  const input={lessonId:id,title:"Basics",sequence:0,contentType:"YOUTUBE",externalUrl:"https://youtu.be/abc",durationSeconds:60};
  expect(createLessonContentInputSchema.safeParse(input).success).toBe(true);
  expect(createLessonContentInputSchema.safeParse({...input,externalUrl:"https://example.org"}).success).toBe(false);
 });
 it("requires valid live start/end order",()=>{
  const input={lessonId:id,title:"Live 1",sequence:0,contentType:"LIVE_CLASS",
   externalUrl:"https://meet.example.org/class",startsAt:"2026-10-16T09:00:00.000Z",endsAt:"2026-10-16T11:00:00.000Z"};
  expect(createLessonContentInputSchema.safeParse(input).success).toBe(true);
  expect(createLessonContentInputSchema.safeParse({...input,endsAt:"2026-10-16T08:00:00.000Z"}).success).toBe(false);
 });
 it("uses the existing server-authorized create and edit paths",()=>{
  const v=readFileSync(new URL("../../src/components/courses/college-content-authoring-control.tsx",import.meta.url),"utf8");
  expect(v).toContain("/api/courses/lesson-contents");
  expect(v).toContain("Meeting Link");
  expect(v).toContain("Video length (seconds)");
 });
});
