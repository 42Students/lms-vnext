import {describe,expect,it} from "vitest";
import {legacySuperAdminContentHandoffHref,legacySuperAdminLessonContentHref} from "@/modules/courses/super-admin-content-directory-model";

describe("legacy Super Admin lesson-content links",()=>{
 it("preserves safe lesson chooser state for both old content entry points",()=>{
  const link=legacySuperAdminContentHandoffHref({
   type:"resources",classId:"0",lessonSearch:"  Intro  ",lessonPage:"4",
   collegeId:"different-tenant",returnTo:"https://external.invalid",
  });
  expect(link).toBe("/admin/resources?scope=SHARED&lessonSearch=Intro&lessonPage=4");
 });
 it("does not forward malformed lesson chooser or external-navigation parameters",()=>{
  const link=legacySuperAdminContentHandoffHref({
   type:"video",q:"lessons",lessonPage:"99999",lessonSearch:"x".repeat(101),
   redirect:"https://external.invalid",organizationId:"foreign",
  });
  expect(link).toBe("/admin/videos?q=lessons");
 });

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
 it("drops untrusted college/return selectors while preserving bounded content state",()=>{
  const link=legacySuperAdminLessonContentHref({
   type:"resources",q:"  introduction  ",status:"PUBLISHED",page:"2",
   collegeId:"foreign-college",organizationId:"foreign-org",
   returnTo:"https://malicious.example",redirect:"//malicious.example",
  });
  expect(link).toBe("/admin/resources?q=introduction&status=PUBLISHED&page=2");
  expect(link).not.toContain("foreign");
  expect(link).not.toContain("malicious");
 });
 it("rejects malformed or duplicate Section selector values",()=>{
  const invalid=legacySuperAdminLessonContentHref({
   type:"video",deliveryId:["bad","11111111-1111-4111-8111-111111111111"],
   scope:"SECTION",page:"-4",q:"x".repeat(101),
  });
  expect(invalid).toBe("/admin/videos");
 });
 it("keeps explicitly selected scoped vNext filters",()=>{
  const delivery="11111111-1111-4111-8111-111111111111";
  expect(legacySuperAdminLessonContentHref({type:"resource",deliveryId:delivery,scope:"SECTION"}))
   .toBe("/admin/resources?deliveryId="+delivery+"&scope=SECTION");
 });
});
