import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("LEARNER-home-courses-14 official class announcements",()=>{
 it("LEARNER-home-courses-14 never silently classifies discussion posts as official notices",()=>{
  const page=read("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  expect(page).toContain("listLearnerCourseClassAnnouncements(context,courseMeta.sectionId)");
  expect(page).not.toContain("listCourseDiscussionMessages(");
  expect(page).toContain("title:announcement.title");
 });
 it("LEARNER-home-courses-14 requires a validated learner and owned class",()=>{
  const service=read("src/modules/courses/learner-course-announcements-service.ts");
  expect(service).toContain('member.roles.includes("LEARNER")');
  expect(service).toContain("eq(learnerProgramEnrollments.membershipId,member.id)");
  expect(service).toContain("eq(sectionEnrollments.sectionId,sectionId)");
  expect(service).toContain("if(!section");
 });
 it("LEARNER-home-courses-14 never reads another college, organization or audience",()=>{
  const service=read("src/modules/courses/learner-course-announcements-service.ts");
  expect(service).toContain("eq(db10Announcements.collegeId,member.collegeId)");
  expect(service).toContain("eq(db10Announcements.organizationId,member.organizationId)");
  expect(service).toContain('eq(db10Announcements.receiverType,"CLASS")');
  expect(service).toContain("eq(db10Announcements.receiverId,sectionId)");
 });
 it("LEARNER-home-courses-14 hides unapproved, expired and deleted notices",()=>{
  const service=read("src/modules/courses/learner-course-announcements-service.ts");
  expect(service).toContain('inArray(db10Announcements.senderType,["COLLEGE_ADMIN","FACULTY"])');
  expect(service).toContain("isNull(db10Announcements.deletedAt)");
  expect(service).toContain("lte(db10Announcements.scheduledAt,now)");
  expect(service).toContain("gt(db10Announcements.expiresAt,now)");
 });
 it("LEARNER-home-courses-14 shows exactly the latest two official class notices",()=>{
  const service=read("src/modules/courses/learner-course-announcements-service.ts");
  expect(service).toContain("desc(db10Announcements.createdAt)");
  expect(service).toContain(".limit(2)");
  const overview=read("src/components/courses/learner-course-overview.tsx");
  expect(overview).toContain("key: `announcement-${update.id}`");
  expect(overview).toContain("title: update.title");
  expect(overview).toContain('href: "/learn/notifications"');
 });
 it("LEARNER-home-courses-14 degrades safely when the registered announcement table is unavailable",()=>{
  const service=read("src/modules/courses/learner-course-announcements-service.ts");
  expect(service).toContain('placementTableExists("announcements")');
  expect(service).toContain("return []");
 });
});
