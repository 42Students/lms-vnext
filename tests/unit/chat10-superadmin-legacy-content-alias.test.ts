import {describe,expect,it} from "vitest";
import {legacySuperAdminLessonContentHref} from "@/modules/courses/super-admin-content-directory-model";

describe("legacy Super Admin lesson-content links",()=>{
 it("preserves the old shared classId=0 meaning",()=>{
  expect(legacySuperAdminLessonContentHref({type:"resources",classId:"0"}))
   .toBe("/admin/resources?scope=SHARED");
  expect(legacySuperAdminLessonContentHref({type:"video",classId:"0"}))
   .toBe("/admin/videos?scope=SHARED");
 });
 it("preserves UUID Section scope but never infers a cross-college delivery from a numeric class ID",()=>{
  const delivery="11111111-1111-4111-8111-111111111111";
  expect(legacySuperAdminLessonContentHref({type:"live-class",classId:delivery}))
   .toBe("/admin/live-classes?deliveryId="+delivery+"&scope=SECTION");
  expect(legacySuperAdminLessonContentHref({type:"video",classId:"17"}))
   .toBe("/admin/videos");
 });
 it("keeps explicitly selected scoped vNext filters",()=>{
  const delivery="11111111-1111-4111-8111-111111111111";
  expect(legacySuperAdminLessonContentHref({type:"resource",deliveryId:delivery,scope:"SECTION"}))
   .toBe("/admin/resources?deliveryId="+delivery+"&scope=SECTION");
 });
});
