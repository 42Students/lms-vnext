import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolveSuperAdminAuthoringLesson} from "@/modules/courses/super-admin-selected-lesson-model";
import {sanitizeCourseDisplayHtml,updateCourseDisplayContentSchema} from "@/modules/courses/course-display-validation";
import {deliveryContentOrderInputSchema} from "@/modules/courses/lesson-content-order-validation";

const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
const c="33333333-3333-4333-8333-333333333333";
describe("SA-academics-people-58 GR-COURSES-TENANT-02 authoring, stale tabs and content sanitization",()=>{
 it("switching acting college invalidates previous lesson and safely selects only current authorized lessons",()=>{
  const collegeA=[{id:a,courseName:"College A"}];
  const collegeB=[{id:b,courseName:"College B"},{id:c,courseName:"College B second"}];
  expect(resolveSuperAdminAuthoringLesson(collegeA,a)).toBe(collegeA[0]);
  expect(resolveSuperAdminAuthoringLesson(collegeB,a)).toBe(collegeB[0]);
  expect(resolveSuperAdminAuthoringLesson(collegeB,c)).toBe(collegeB[1]);
  expect(resolveSuperAdminAuthoringLesson([],a)).toBeUndefined();
  const authoring=readFileSync("src/components/courses/super-admin-content-authoring.tsx","utf8");
  expect(authoring).toContain("resolveSuperAdminAuthoringLesson(courseLessons,lessonId)");
  expect(authoring).toContain("lessons.filter(item=>item.offeringId===course?.id)");
  expect(authoring).toContain('value={selected?.id??""}');
  expect(authoring).toContain("key={contentKey}");
 });
 it("sanitizer removes all event handlers, SVG, javascript links and embeds while preserving plain readable markup",()=>{
  const raw='<p onclick="alert(1)">Hi <strong style="color:red">team</strong><svg onload="steal()"><script>bad()</script></svg><a href="javascript:steal()">tap</a></p>';
  const cleaned=sanitizeCourseDisplayHtml(raw);
  expect(cleaned).toContain("<p>Hi <strong>team</strong>");
  expect(cleaned).not.toContain("<svg ");
  expect(cleaned).not.toContain("<script>");
  expect(cleaned).not.toContain("<a ");
  expect(cleaned).not.toContain("onclick=");
  expect(cleaned).not.toContain("style=");
  expect(cleaned).not.toMatch(/<a\s/i);
  expect(cleaned).toContain("&lt;svg");
  expect(sanitizeCourseDisplayHtml(null)).toBeNull();
  expect(sanitizeCourseDisplayHtml("   ")).toBeNull();
 });
 it("course display rejects cross-origin non-HTTPS images and trims/deduplicates takeaways",()=>{
  const base={introductionText:null,bodyHtml:null,takeaways:["  Clarity ","clarity","Scale"],thumbnailUrl:null,expectedVersion:null};
  const parsed=updateCourseDisplayContentSchema.parse(base);
  expect(parsed.takeaways).toEqual(["Clarity","Scale"]);
  for(const bad of ["http://untrusted.invalid/a.png","javascript:alert(1)","file:///tmp/image.png"]){
   expect(updateCourseDisplayContentSchema.safeParse({...base,thumbnailUrl:bad}).success).toBe(false);
  }
  expect(updateCourseDisplayContentSchema.safeParse({...base,expectedVersion:-1}).success).toBe(false);
  expect(updateCourseDisplayContentSchema.safeParse({...base,bodyHtml:"x".repeat(20001)}).success).toBe(false);
  expect(updateCourseDisplayContentSchema.safeParse({...base,takeaways:Array(31).fill("x")}).success).toBe(false);
 });
 it("reorder requires scoped delivery and lesson IDs; refuses empty, repeated or oversized content lists",()=>{
  const command={lessonId:a,deliveryId:b,orderedContentIds:[c],expectedOrderedContentIds:[c]};
  expect(deliveryContentOrderInputSchema.safeParse(command).success).toBe(true);
  for(const wrong of [
   {...command,orderedContentIds:[]},{...command,orderedContentIds:[c,c]},
   {...command,orderedContentIds:Array(1001).fill(c)},
   {...command,lessonId:"another-college"}, {...command,deliveryId:"wrong"},
  ])expect(deliveryContentOrderInputSchema.safeParse(wrong).success).toBe(false);
 });
});
